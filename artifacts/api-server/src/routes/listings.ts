import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import {
  dbBuildListingDetail,
  dbCreateListing,
  dbEnsureUser,
  dbListListings,
  dbUpdateUser,
  dbCountSellerListings,
  dbPromoteListing,
  withResolvedListingCoords,
} from "../lib/listings-store";
import { getSupabaseAdmin } from "../lib/supabase-db";
import { trackUniqueListingView } from "../lib/views";
import { purgeListingCompletely } from "../lib/purge-listing";
import { authMiddleware, optionalAuth } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { notifyAdmins } from "../lib/notify-admins";

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
      neighborhood: req.query.neighborhood as string | undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      radiusKm: req.query.radiusKm ? Number(req.query.radiusKm) : undefined,
      lat,
      lon,
      sort: req.query.sort as "date_desc" | "date_asc" | "price_asc" | "price_desc" | undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
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
      cursor: req.query.cursor as string | undefined,
    });
    res.json(result);
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
    const sellerListingCount = await dbCountSellerListings(req.user!.id);

    const sellerName = detail.seller?.name ?? req.user!.name ?? "Satıcı";
    void notifyAdmins({
      type: "admin_new_listing",
      title: "Yeni İlan",
      subtitle: detail.title,
      body: `${sellerName} · ${Number(detail.price).toLocaleString("tr-TR")} ₺ · ${detail.category}`,
      data: { listingId: detail.id, screen: "listing" },
    }).catch(() => {});

    res.status(201).json({ ...detail, sellerListingCount });
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

    const { count: oldImageCount } = await sb
      .from("listing_images")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listing.id);

    const oldPrice = listing.price;
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

    const { notifyListingFavoriters } = await import("../lib/notify-favorite-watchers");
    const newPrice = body.price ?? oldPrice;

    if (body.price != null && newPrice < oldPrice) {
      await notifyListingFavoriters(listing.id, listing.seller_id, {
        changeType: "price_drop",
        oldPrice,
        newPrice,
      });
    } else if (images && images.length > (oldImageCount ?? 0)) {
      await notifyListingFavoriters(listing.id, listing.seller_id, {
        changeType: "image_added",
        imageCount: images.length,
      });
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

    if (status === "sold") {
      const { notifyListingFavoriters } = await import("../lib/notify-favorite-watchers");
      await notifyListingFavoriters(req.params.listingId, listing.seller_id, { changeType: "sold" });
    }

    res.json(await dbBuildListingDetail(req.params.listingId, req.user!.id));
  } catch (err) {
    next(err);
  }
});

router.post("/listings/:listingId/promote", authMiddleware, async (req, res, next) => {
  try {
    const listingId = Array.isArray(req.params.listingId) ? req.params.listingId[0]! : req.params.listingId;
    const { getAppConfig } = await import("../lib/app-config");
    const { mergeAdMobConfig } = await import("../lib/mobile-admob");
    const admob = mergeAdMobConfig(await getAppConfig());
    const boostHours = Math.min(Math.max(admob.rewarded.boostHours || 2, 1), 24);
    const result = await dbPromoteListing(listingId, req.user!.id, boostHours);
    const detail = await dbBuildListingDetail(listingId, req.user!.id);
    res.json({ success: true, promotedUntil: result.promotedUntil, listing: detail });
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
