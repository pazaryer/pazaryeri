import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import {
  dbBuildListingDetail,
  dbCreateListing,
  dbEnsureUser,
  dbListListings,
  dbUpdateUser,
  withResolvedListingCoords,
} from "../lib/listings-store";
import { getSupabaseAdmin } from "../lib/supabase-db";
import { trackUniqueListingView } from "../lib/views";
import { purgeListingCompletely } from "../lib/purge-listing";
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
  contactPhone: z.string().max(30).optional(),
  images: z
    .array(z.string().min(1).refine((u) => /^https?:\/\//i.test(u), "Geçersiz görsel URL"))
    .min(1)
    .max(10),
});

const updateListingSchema = createListingSchema.partial();
const statusSchema = z.object({ status: z.enum(["active", "sold", "reserved", "deleted"]) });

router.get("/listings", optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const lat = req.query.lat ? Number(req.query.lat) : undefined;
    const lon = req.query.lon ? Number(req.query.lon) : undefined;
    const result = await dbListListings({
      limit,
      category: req.query.category as string | undefined,
      q: req.query.q as string | undefined,
      cursor: req.query.cursor as string | undefined,
      sellerId: req.query.sellerId as string | undefined,
      userId: req.user?.id,
      city: req.query.city as string | undefined,
      district: req.query.district as string | undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      radiusKm: req.query.radiusKm ? Number(req.query.radiusKm) : undefined,
      lat,
      lon,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/listings/me", authMiddleware, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const result = await dbListListings({
      limit,
      sellerId: req.user!.id,
      userId: req.user!.id,
      includeNonActive: true,
    });
    res.json({ ...result, hasMore: false, nextCursor: null });
  } catch (err) {
    next(err);
  }
});

router.get("/listings/:listingId/insights", authMiddleware, async (req, res, next) => {
  try {
    const { getListingInsights } = await import("../lib/listing-insights");
    const insights = await getListingInsights(req.params.listingId, req.user!.id);
    res.json(insights);
  } catch (err) {
    next(err);
  }
});

router.get("/listings/:listingId", optionalAuth, async (req, res, next) => {
  try {
    const listingId = req.params.listingId;
    const deviceId = req.headers["x-device-id"] as string | undefined;
    await trackUniqueListingView(listingId, deviceId, req.user?.id);
    const detail = await dbBuildListingDetail(listingId, req.user?.id);
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

router.post("/listings", authMiddleware, async (req, res, next) => {
  try {
    const body = createListingSchema.parse(req.body);
    await dbEnsureUser(req.user!.id, {
      email: req.user!.email,
      phone: body.contactPhone ?? req.user!.phone,
    });
    if (body.contactPhone) {
      await dbUpdateUser(req.user!.id, { phone: body.contactPhone });
    }
    const detail = await dbCreateListing(req.user!.id, body);
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

    const { images, acceptsOffers, contactPhone, ...rest } = body;
    const update: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };

    const resolved = await withResolvedListingCoords({
      latitude: rest.latitude ?? listing.latitude ?? undefined,
      longitude: rest.longitude ?? listing.longitude ?? undefined,
      city: rest.city ?? listing.city ?? undefined,
      district: rest.district ?? listing.district ?? undefined,
      location: rest.location ?? listing.location ?? undefined,
    });
    if (resolved.latitude != null) update.latitude = resolved.latitude;
    if (resolved.longitude != null) update.longitude = resolved.longitude;
    if (acceptsOffers !== undefined) update.accepts_offers = acceptsOffers;
    if (contactPhone !== undefined) update.contact_phone = contactPhone;

    await sb.from("listings").update(update).eq("id", listing.id);

    if (images) {
      await sb.from("listing_images").delete().eq("listing_id", listing.id);
      await sb.from("listing_images").insert(
        images.map((url, i) => ({ listing_id: listing.id, url, sort_order: i })),
      );
    }

    res.json(await dbBuildListingDetail(listing.id, req.user!.id));
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
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status, updated_at: now };
    if (status === "sold") patch.sold_at = now;
    else if (status === "active") patch.sold_at = null;
    await sb.from("listings").update(patch).eq("id", req.params.listingId);
    res.json(await dbBuildListingDetail(req.params.listingId, req.user!.id));
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
    await purgeListingCompletely(req.params.listingId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
