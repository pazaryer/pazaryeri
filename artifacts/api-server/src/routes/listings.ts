import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import {
  getSupabaseAdmin,
  ensureUser,
  formatListingSummary,
  getFavoriteSet,
  getListingImages,
  formatUser,
  type DbListing,
  type DbUser,
} from "../lib/supabase-db";
import { authMiddleware, optionalAuth } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const router: IRouter = Router();

const createListingSchema = z.object({
  title: z.string().min(3).max(200),
  price: z.number().int().min(0),
  category: z.string().min(1),
  description: z.string().default(""),
  city: z.string().optional(),
  district: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  acceptsOffers: z.boolean().default(true),
  images: z.array(z.string().url()).min(1).max(10),
});

const updateListingSchema = createListingSchema.partial();
const statusSchema = z.object({ status: z.enum(["active", "sold", "reserved", "deleted"]) });

async function buildListingDetail(listingId: string, userId?: string) {
  const sb = getSupabaseAdmin();
  const { data: listing, error } = await sb.from("listings").select("*").eq("id", listingId).single();
  if (error || !listing || listing.status === "deleted") throw new AppError("İlan bulunamadı", 404);

  const { data: seller } = await sb.from("users").select("*").eq("id", listing.seller_id).single();
  if (!seller) throw new AppError("Satıcı bulunamadı", 404);

  const imageMap = await getListingImages([listing.id]);
  const images = imageMap.get(listing.id) ?? [];
  const favSet = await getFavoriteSet(userId, [listing.id]);

  let userLat: number | null = null;
  let userLon: number | null = null;
  if (userId) {
    const { data: me } = await sb.from("users").select("latitude, longitude").eq("id", userId).single();
    userLat = me?.latitude ?? null;
    userLon = me?.longitude ?? null;
  }

  const summary = await formatListingSummary(
    listing as DbListing,
    seller as DbUser,
    images[0] ?? "",
    favSet.has(listing.id),
    userLat,
    userLon,
  );

  return {
    ...summary,
    description: listing.description,
    images,
    acceptsOffers: listing.accepts_offers,
    sellerId: listing.seller_id,
    latitude: listing.latitude,
    longitude: listing.longitude,
    seller: formatUser(seller as DbUser),
  };
}

router.get("/listings", optionalAuth, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const category = req.query.category as string | undefined;
    const q = req.query.q as string | undefined;
    const cursor = req.query.cursor as string | undefined;
    const sellerId = req.query.sellerId as string | undefined;

    let query = sb
      .from("listings")
      .select("*, users!listings_seller_id_fkey(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (category && category !== "Tümü") query = query.eq("category", category);
    if (q) query = query.ilike("title", `%${q}%`);
    if (sellerId) query = query.eq("seller_id", sellerId);
    if (cursor) query = query.lt("created_at", cursor);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const hasMore = (rows?.length ?? 0) > limit;
    const page = hasMore ? rows!.slice(0, limit) : rows ?? [];
    const listingIds = page.map((r) => r.id);
    const imageMap = await getListingImages(listingIds);
    const favSet = await getFavoriteSet(req.user?.id, listingIds);

    let userLat: number | null = null;
    let userLon: number | null = null;
    if (req.user?.id) {
      const { data: me } = await sb.from("users").select("latitude, longitude").eq("id", req.user.id).single();
      userLat = me?.latitude ?? null;
      userLon = me?.longitude ?? null;
    }

    const items = await Promise.all(
      page.map((row) => {
        const seller = row.users as DbUser;
        return formatListingSummary(
          row as DbListing,
          seller,
          imageMap.get(row.id)?.[0] ?? "",
          favSet.has(row.id),
          userLat,
          userLon,
        );
      }),
    );

    res.json({
      items,
      hasMore,
      nextCursor: hasMore ? page[page.length - 1].created_at : null,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/listings/me", authMiddleware, async (req, res, next) => {
  try {
    req.query.sellerId = req.user!.id;
    const sb = getSupabaseAdmin();
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const { data: rows } = await sb
      .from("listings")
      .select("*, users!listings_seller_id_fkey(*)")
      .eq("seller_id", req.user!.id)
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(limit);

    const listingIds = (rows ?? []).map((r) => r.id);
    const imageMap = await getListingImages(listingIds);

    const items = await Promise.all(
      (rows ?? []).map((row) =>
        formatListingSummary(
          row as DbListing,
          row.users as DbUser,
          imageMap.get(row.id)?.[0] ?? "",
          false,
        ),
      ),
    );

    res.json({ items, hasMore: false, nextCursor: null });
  } catch (err) {
    next(err);
  }
});

router.get("/listings/:listingId", optionalAuth, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    await sb.rpc("increment_views", { listing_id: req.params.listingId }).catch(() => {
      return sb.from("listings").select("views").eq("id", req.params.listingId).single()
        .then(({ data }) => {
          if (data) return sb.from("listings").update({ views: data.views + 1 }).eq("id", req.params.listingId);
        });
    });
    const detail = await buildListingDetail(req.params.listingId, req.user?.id);
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

router.post("/listings", authMiddleware, async (req, res, next) => {
  try {
    const body = createListingSchema.parse(req.body);
    await ensureUser(req.user!.id);
    const sb = getSupabaseAdmin();

    const { data: listing, error } = await sb
      .from("listings")
      .insert({
        seller_id: req.user!.id,
        title: body.title,
        price: body.price,
        category: body.category,
        description: body.description,
        city: body.city,
        district: body.district,
        location: body.location,
        latitude: body.latitude,
        longitude: body.longitude,
        accepts_offers: body.acceptsOffers,
      })
      .select()
      .single();

    if (error || !listing) throw new Error(error?.message ?? "İlan oluşturulamadı");

    await sb.from("listing_images").insert(
      body.images.map((url, i) => ({ listing_id: listing.id, url, sort_order: i })),
    );

    const detail = await buildListingDetail(listing.id, req.user!.id);
    res.status(201).json(detail);
  } catch (err) {
    next(err);
  }
});

router.put("/listings/:listingId", authMiddleware, async (req, res, next) => {
  try {
    const body = updateListingSchema.parse(req.body);
    const sb = getSupabaseAdmin();
    const { data: listing } = await sb.from("listings").select("*").eq("id", req.params.listingId).single();
    if (!listing) throw new AppError("İlan bulunamadı", 404);
    if (listing.seller_id !== req.user!.id) throw new AppError("Bu ilanı düzenleme yetkiniz yok", 403);

    const { images, acceptsOffers, ...rest } = body;
    const update: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
    if (acceptsOffers !== undefined) update.accepts_offers = acceptsOffers;

    await sb.from("listings").update(update).eq("id", listing.id);

    if (images) {
      await sb.from("listing_images").delete().eq("listing_id", listing.id);
      await sb.from("listing_images").insert(
        images.map((url, i) => ({ listing_id: listing.id, url, sort_order: i })),
      );
    }

    res.json(await buildListingDetail(listing.id, req.user!.id));
  } catch (err) {
    next(err);
  }
});

router.patch("/listings/:listingId/status", authMiddleware, async (req, res, next) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const sb = getSupabaseAdmin();
    const { data: listing } = await sb.from("listings").select("seller_id").eq("id", req.params.listingId).single();
    if (!listing) throw new AppError("İlan bulunamadı", 404);
    if (listing.seller_id !== req.user!.id) throw new AppError("Yetkisiz", 403);
    await sb.from("listings").update({ status, updated_at: new Date().toISOString() }).eq("id", req.params.listingId);
    res.json(await buildListingDetail(req.params.listingId, req.user!.id));
  } catch (err) {
    next(err);
  }
});

router.delete("/listings/:listingId", authMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: listing } = await sb.from("listings").select("seller_id").eq("id", req.params.listingId).single();
    if (!listing) throw new AppError("İlan bulunamadı", 404);
    if (listing.seller_id !== req.user!.id) throw new AppError("Yetkisiz", 403);
    await sb.from("listings").update({ status: "deleted", updated_at: new Date().toISOString() }).eq("id", req.params.listingId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
