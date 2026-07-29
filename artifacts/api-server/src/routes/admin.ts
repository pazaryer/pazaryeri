import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { adminMiddleware, superAdminMiddleware } from "../middleware/adminAuth";
import { AppError } from "../middleware/errorHandler";
import { getSupabaseAdmin, ensureUser } from "../lib/supabase-db";
import {
  getAppConfig,
  setAppConfig,
  deleteAppConfigKey,
  invalidateAppConfigCache,
} from "../lib/app-config";
import { CONFIG_KEYS, DEFAULT_APP_CONFIG } from "../lib/app-config-defaults";
import { mergeBrandingBundle, brandingBundleToConfigKeys, type BrandingBundle } from "../lib/branding";
import { storeListingImage } from "../lib/image-storage";
import { purgeListingCompletely } from "../lib/purge-listing";
import { dbBuildListingDetail } from "../lib/listings-store";
import { getLiveAnalytics } from "../lib/presence";
import { resetLiveAnalytics, getAnalyticsResetAt } from "../lib/analytics-reset";

const router: IRouter = Router();

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0]! : value;
}

function clientIp(req: { ip?: string; headers: Record<string, unknown> }): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]?.trim() ?? req.ip ?? "";
  return req.ip ?? "";
}

// ─── Dashboard ───────────────────────────────────────────────

router.get("/admin/me", adminMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: user } = await sb
      .from("users")
      .select("id, name, email, role, avatar")
      .eq("id", req.user!.id)
      .single();
    res.json({
      ...user,
      role: user?.role ?? "moderator",
    });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/stats", adminMiddleware, async (_req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const live = await getLiveAnalytics();
    const [
      users,
      listings,
      activeListings,
      soldListings,
      comments,
      reports,
      conversations,
      bannedUsers,
    ] = await Promise.all([
      sb.from("users").select("id", { count: "exact", head: true }),
      sb.from("listings").select("id", { count: "exact", head: true }),
      sb.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb.from("listings").select("id", { count: "exact", head: true }).eq("status", "sold"),
      sb.from("listing_comments").select("id", { count: "exact", head: true }),
      sb.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("conversations").select("id", { count: "exact", head: true }),
      sb.from("users").select("id", { count: "exact", head: true }).eq("is_banned", true),
    ]);

    const { data: recentUsers } = await sb
      .from("users")
      .select("id, name, email, badge_emoji, badge_label, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recentListings } = await sb
      .from("listings")
      .select("id, title, price, status, created_at, users(name)")
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(5);

    res.json({
      counts: {
        users: users.count ?? 0,
        listings: listings.count ?? 0,
        activeListings: activeListings.count ?? 0,
        soldListings: soldListings.count ?? 0,
        comments: comments.count ?? 0,
        pendingReports: reports.count ?? 0,
        conversations: conversations.count ?? 0,
        bannedUsers: bannedUsers.count ?? 0,
      },
      live,
      analyticsResetAt: await getAnalyticsResetAt(),
      recentUsers: recentUsers ?? [],
      recentListings: (recentListings ?? []).map((l) => ({
        id: l.id,
        title: l.title,
        price: l.price,
        status: l.status,
        createdAt: l.created_at,
        sellerName: (l.users as { name?: string } | null)?.name ?? "—",
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/stats/reset", superAdminMiddleware, async (req, res, next) => {
  try {
    const { resetAt } = await resetLiveAnalytics(req.user!.id);
    invalidateAppConfigCache();
    await logAdminAction(req.user!.id, "analytics.reset", {
      targetType: "analytics",
      details: { resetAt },
      ip: clientIp(req),
    });
    res.json({
      success: true,
      resetAt,
      message: "Canlı istatistikler sıfırlandı. Kullanıcı verileri korundu.",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/publish", superAdminMiddleware, async (req, res, next) => {
  try {
    invalidateAppConfigCache();
    await logAdminAction(req.user!.id, "site.publish", {
      targetType: "site",
      ip: clientIp(req),
    });
    res.json({
      success: true,
      publishedAt: new Date().toISOString(),
      message: "Tüm ayarlar yayınlandı. Web ve mobil ~60 saniye içinde güncellenir.",
    });
  } catch (err) {
    next(err);
  }
});

// ─── Users ───────────────────────────────────────────────────

router.get("/admin/users", adminMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const offset = Number(req.query.offset) || 0;
    const q = String(req.query.q ?? "").trim();
    const role = req.query.role as string | undefined;
    const banned = req.query.banned === "true" ? true : req.query.banned === "false" ? false : undefined;

    let query = sb
      .from("users")
      .select(
        "id, name, email, phone, avatar, city, role, is_verified, is_banned, ban_reason, badge_emoji, badge_label, badge_color, rating, total_sales, created_at, last_active_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
    }
    if (role) query = query.eq("role", role);
    if (banned !== undefined) query = query.eq("is_banned", banned);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    res.json({ items: data ?? [], total: count ?? 0, offset, limit });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/users/:userId", adminMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: user, error } = await sb
      .from("users")
      .select("*")
      .eq("id", param(req.params.userId))
      .single();
    if (error || !user) throw new AppError("Kullanıcı bulunamadı", 404);

    const [{ count: listingCount }, { count: commentCount }] = await Promise.all([
      sb.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", user.id),
      sb.from("listing_comments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    res.json({
      ...user,
      stats: { listings: listingCount ?? 0, comments: commentCount ?? 0 },
    });
  } catch (err) {
    next(err);
  }
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["user", "moderator", "admin"]).optional(),
  isVerified: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  banReason: z.string().max(500).optional().nullable(),
  badgeEmoji: z.string().max(8).optional().nullable(),
  badgeLabel: z.string().max(40).optional().nullable(),
  badgeColor: z.string().max(20).optional().nullable(),
  clearBadge: z.boolean().optional(),
});

router.patch("/admin/users/:userId", adminMiddleware, async (req, res, next) => {
  try {
    const body = updateUserSchema.parse(req.body);
    const sb = getSupabaseAdmin();
    const userId = param(req.params.userId);

    if (body.role && req.adminRole !== "admin") {
      throw new AppError("Rol değiştirmek için süper admin gerekli", 403);
    }

    if (userId === req.user!.id && body.role && body.role !== "admin") {
      throw new AppError("Kendi admin rolünüzü kaldıramazsınız", 400);
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name) update.name = body.name;
    if (body.role) update.role = body.role;
    if (body.isVerified !== undefined) update.is_verified = body.isVerified;
    if (body.isBanned !== undefined) {
      update.is_banned = body.isBanned;
      update.ban_reason = body.isBanned ? (body.banReason ?? "Admin tarafından engellendi") : null;
      update.banned_at = body.isBanned ? new Date().toISOString() : null;
    }
    if (body.clearBadge) {
      update.badge_emoji = null;
      update.badge_label = null;
      update.badge_color = null;
    } else {
      if (body.badgeEmoji !== undefined) update.badge_emoji = body.badgeEmoji;
      if (body.badgeLabel !== undefined) update.badge_label = body.badgeLabel;
      if (body.badgeColor !== undefined) update.badge_color = body.badgeColor;
    }

    const { data, error } = await sb.from("users").update(update).eq("id", userId).select().single();
    if (error || !data) throw new AppError("Güncelleme başarısız", 400);

    await logAdminAction(req.user!.id, "user.update", {
      targetType: "user",
      targetId: userId,
      details: body as Record<string, unknown>,
      ip: clientIp(req),
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Listings ────────────────────────────────────────────────

router.get("/admin/listings", adminMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const offset = Number(req.query.offset) || 0;
    const q = String(req.query.q ?? "").trim();
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const sellerId = req.query.sellerId as string | undefined;

    let query = sb
      .from("listings")
      .select("*, users!listings_seller_id_fkey(id, name, email)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    else query = query.neq("status", "deleted");
    if (category) query = query.eq("category", category);
    if (sellerId) query = query.eq("seller_id", sellerId);
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    res.json({
      items: (data ?? []).map((l) => ({
        id: l.id,
        title: l.title,
        price: l.price,
        category: l.category,
        status: l.status,
        city: l.city,
        district: l.district,
        createdAt: l.created_at,
        seller: l.users,
      })),
      total: count ?? 0,
      offset,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/listings/:listingId", adminMiddleware, async (req, res, next) => {
  try {
    const detail = await dbBuildListingDetail(param(req.params.listingId));
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

const adminListingUpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  price: z.number().int().min(0).optional(),
  category: z.string().optional(),
  status: z.enum(["active", "sold", "reserved", "deleted"]).optional(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  acceptsOffers: z.boolean().optional(),
  contactPhone: z.string().max(30).optional().nullable(),
});

router.patch("/admin/listings/:listingId", adminMiddleware, async (req, res, next) => {
  try {
    const body = adminListingUpdateSchema.parse(req.body);
    const sb = getSupabaseAdmin();
    const listingId = param(req.params.listingId);

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.price !== undefined) update.price = body.price;
    if (body.category) update.category = body.category;
    if (body.status) update.status = body.status;
    if (body.city !== undefined) update.city = body.city;
    if (body.district !== undefined) update.district = body.district;
    if (body.location !== undefined) update.location = body.location;
    if (body.acceptsOffers !== undefined) update.accepts_offers = body.acceptsOffers;
    if (body.contactPhone !== undefined) update.contact_phone = body.contactPhone;

    const { error } = await sb.from("listings").update(update).eq("id", listingId);
    if (error) throw new AppError(error.message, 400);

    await logAdminAction(req.user!.id, "listing.update", {
      targetType: "listing",
      targetId: listingId,
      details: body as Record<string, unknown>,
      ip: clientIp(req),
    });

    const detail = await dbBuildListingDetail(listingId);
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

router.delete("/admin/listings/:listingId", adminMiddleware, async (req, res, next) => {
  try {
    await purgeListingCompletely(param(req.params.listingId));
    await logAdminAction(req.user!.id, "listing.delete", {
      targetType: "listing",
      targetId: param(req.params.listingId),
      ip: clientIp(req),
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── Comments ────────────────────────────────────────────────

router.get("/admin/comments", adminMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const offset = Number(req.query.offset) || 0;
    const q = String(req.query.q ?? "").trim();
    const listingId = req.query.listingId as string | undefined;
    const userId = req.query.userId as string | undefined;

    let query = sb
      .from("listing_comments")
      .select("*, users(id, name, email), listings(id, title)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (listingId) query = query.eq("listing_id", listingId);
    if (userId) query = query.eq("user_id", userId);
    if (q) query = query.ilike("content", `%${q}%`);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    res.json({
      items: (data ?? []).map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.created_at,
        listingId: c.listing_id,
        listingTitle: (c.listings as { title?: string } | null)?.title ?? "—",
        user: c.users,
      })),
      total: count ?? 0,
      offset,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/comments", adminMiddleware, async (req, res, next) => {
  try {
    const body = z
      .object({
        listingId: z.string().uuid(),
        content: z.string().min(2).max(1000),
        userId: z.string().uuid().optional(),
      })
      .parse(req.body);

    const authorId = body.userId ?? req.user!.id;
    if (body.userId) await ensureUser(body.userId);

    const sb = getSupabaseAdmin();
    const { data: comment, error } = await sb
      .from("listing_comments")
      .insert({
        listing_id: body.listingId,
        user_id: authorId,
        content: body.content.trim(),
      })
      .select("*, users(id, name, avatar)")
      .single();

    if (error || !comment) throw new AppError("Yorum eklenemedi", 400);

    await logAdminAction(req.user!.id, "comment.create", {
      targetType: "comment",
      targetId: comment.id,
      details: { listingId: body.listingId, asUserId: body.userId ?? null },
      ip: clientIp(req),
    });

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

router.post("/admin/reviews", adminMiddleware, async (req, res, next) => {
  try {
    const body = z
      .object({
        reviewerId: z.string().uuid(),
        revieweeId: z.string().uuid(),
        listingId: z.string().uuid().optional(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).default(""),
      })
      .parse(req.body);

    if (body.reviewerId === body.revieweeId) {
      throw new AppError("Değerlendiren ve satıcı aynı olamaz", 400);
    }

    await ensureUser(body.reviewerId);
    await ensureUser(body.revieweeId);

    const sb = getSupabaseAdmin();

    if (body.listingId) {
      const { data: listing } = await sb.from("listings").select("seller_id").eq("id", body.listingId).single();
      if (!listing) throw new AppError("İlan bulunamadı", 404);
      if (listing.seller_id !== body.revieweeId) throw new AppError("İlan bu satıcıya ait değil", 400);
    }

    let reviewQuery = sb.from("reviews").select("id").eq("reviewer_id", body.reviewerId);
    if (body.listingId) {
      reviewQuery = reviewQuery.eq("listing_id", body.listingId);
    } else {
      reviewQuery = reviewQuery.is("listing_id", null).eq("reviewee_id", body.revieweeId);
    }
    const { data: existing } = await reviewQuery.limit(1);

    if (existing?.length) {
      await sb
        .from("reviews")
        .update({ rating: body.rating, comment: body.comment, created_at: new Date().toISOString() })
        .eq("id", existing[0]!.id);
    } else {
      const { error } = await sb.from("reviews").insert({
        reviewer_id: body.reviewerId,
        reviewee_id: body.revieweeId,
        listing_id: body.listingId ?? null,
        rating: body.rating,
        comment: body.comment,
      });
      if (error) throw new AppError(error.message, 400);
    }

    const { data: allReviews } = await sb.from("reviews").select("rating").eq("reviewee_id", body.revieweeId);
    const ratings = (allReviews ?? []).map((r) => r.rating as number);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    await sb
      .from("users")
      .update({
        rating: Math.round(avg * 10) / 10,
        total_sales: ratings.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.revieweeId);

    await logAdminAction(req.user!.id, "review.create", {
      targetType: "review",
      targetId: body.revieweeId,
      details: { reviewerId: body.reviewerId, rating: body.rating },
      ip: clientIp(req),
    });

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/admin/comments/:commentId", adminMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("listing_comments").delete().eq("id", param(req.params.commentId));
    if (error) throw new AppError(error.message, 400);

    await logAdminAction(req.user!.id, "comment.delete", {
      targetType: "comment",
      targetId: param(req.params.commentId),
      ip: clientIp(req),
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── Reports ─────────────────────────────────────────────────

router.get("/admin/reports", adminMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const status = (req.query.status as string) || "pending";
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const { data, error } = await sb
      .from("reports")
      .select("*, reporter:users!reports_reporter_id_fkey(id, name), listings(id, title)")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    res.json({ items: data ?? [] });
  } catch (err) {
    next(err);
  }
});

router.patch("/admin/reports/:reportId", adminMiddleware, async (req, res, next) => {
  try {
    const body = z
      .object({ status: z.enum(["pending", "resolved", "dismissed"]) })
      .parse(req.body);

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("reports")
      .update({ status: body.status })
      .eq("id", param(req.params.reportId))
      .select()
      .single();

    if (error || !data) throw new AppError("Şikayet güncellenemedi", 400);

    await logAdminAction(req.user!.id, "report.update", {
      targetType: "report",
      targetId: param(req.params.reportId),
      details: body,
      ip: clientIp(req),
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── App Config (CMS) ────────────────────────────────────────

router.get("/admin/config", adminMiddleware, async (_req, res, next) => {
  try {
    const config = await getAppConfig();
    res.json({
      keys: CONFIG_KEYS,
      config,
      defaults: DEFAULT_APP_CONFIG,
    });
  } catch (err) {
    next(err);
  }
});

router.put("/admin/config/:key", superAdminMiddleware, async (req, res, next) => {
  try {
    const key = param(req.params.key);
    if (!CONFIG_KEYS.includes(key) && !key.startsWith("custom.")) {
      throw new AppError("Geçersiz yapılandırma anahtarı", 400);
    }
    const body = z.object({ value: z.unknown(), description: z.string().optional() }).parse(req.body);
    await setAppConfig(key, body.value, req.user!.id, body.description);

    await logAdminAction(req.user!.id, "config.update", {
      targetType: "config",
      targetId: key,
      ip: clientIp(req),
    });

    res.json({ success: true, key, value: body.value });
  } catch (err) {
    next(err);
  }
});

router.delete("/admin/config/:key", superAdminMiddleware, async (req, res, next) => {
  try {
    await deleteAppConfigKey(param(req.params.key));
    await logAdminAction(req.user!.id, "config.delete", {
      targetType: "config",
      targetId: param(req.params.key),
      ip: clientIp(req),
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── Branding (tam marka yönetimi) ───────────────────────────

const brandAssetUploadSchema = z.object({
  contentType: z.string().default("image/jpeg"),
  data: z.string().min(1),
});

const brandingBundleSchema = z.object({
  name: z.string().min(1).max(80),
  tagline: z.string().max(200).default(""),
  supportEmail: z.string().email().optional(),
  colors: z.object({
    primary: z.string().min(4).max(20),
    primaryDark: z.string().min(4).max(20),
    primaryMid: z.string().min(4).max(20),
    primaryLight: z.string().min(4).max(20),
    gold: z.string().min(4).max(20),
    background: z.string().min(4).max(20),
  }),
  assets: z
    .object({
      iconUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
      logoUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
      splashUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
      faviconUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
      ogImageUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
      adaptiveIconUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
    })
    .default({}),
  seo: z.object({
    title: z.string().min(2).max(200),
    description: z.string().min(10).max(500),
    keywords: z.string().max(500).default(""),
  }),
  app: z
    .object({
      version: z.string().default("1.0.0"),
      minSupportedVersion: z.string().default("1.0.0"),
      forceUpdate: z.boolean().default(false),
      updateMessage: z.string().max(300).default("Yeni sürüm mevcut. Lütfen güncelleyin."),
    })
    .optional(),
});

router.get("/admin/branding", adminMiddleware, async (_req, res, next) => {
  try {
    const config = await getAppConfig();
    const branding = mergeBrandingBundle(config);
    res.json({ branding, defaults: mergeBrandingBundle(DEFAULT_APP_CONFIG) });
  } catch (err) {
    next(err);
  }
});

router.put("/admin/branding", superAdminMiddleware, async (req, res, next) => {
  try {
    const parsed = brandingBundleSchema.parse(req.body);
    const bundle = {
      name: parsed.name,
      tagline: parsed.tagline,
      supportEmail: parsed.supportEmail ?? "pazaryer0@gmail.com",
      colors: parsed.colors,
      assets: Object.fromEntries(
        Object.entries(parsed.assets ?? {}).map(([k, v]) => [k, v && String(v).trim() ? String(v).trim() : null]),
      ) as BrandingBundle["assets"],
      seo: parsed.seo,
      app: {
        version: parsed.app?.version ?? "1.0.0",
        minSupportedVersion: parsed.app?.minSupportedVersion ?? "1.0.0",
        forceUpdate: parsed.app?.forceUpdate ?? false,
        updateMessage: parsed.app?.updateMessage ?? "Yeni sürüm mevcut. Lütfen güncelleyin.",
      },
    } satisfies BrandingBundle;
    const keys = brandingBundleToConfigKeys(bundle);
    await setAppConfig("brand", keys.brand, req.user!.id, "Marka kimliği");
    await setAppConfig("web.seo", keys["web.seo"], req.user!.id, "Web SEO");
    await setAppConfig("mobile.app", keys["mobile.app"], req.user!.id, "Mobil uygulama meta");

    await logAdminAction(req.user!.id, "branding.update", {
      targetType: "branding",
      targetId: bundle.name,
      details: { name: bundle.name },
      ip: clientIp(req),
    });

    res.json({ success: true, branding: mergeBrandingBundle(await getAppConfig()) });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/branding/publish", superAdminMiddleware, async (req, res, next) => {
  try {
    invalidateAppConfigCache();
    const config = await getAppConfig();
    const branding = mergeBrandingBundle(config);

    await logAdminAction(req.user!.id, "branding.publish", {
      targetType: "branding",
      targetId: branding.name,
      ip: clientIp(req),
    });

    res.json({
      success: true,
      publishedAt: new Date().toISOString(),
      branding,
      message:
        "Marka ayarları yayınlandı. Web ve mobil uygulama 60 saniye içinde güncellenecek.",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/upload/brand-asset", superAdminMiddleware, async (req, res, next) => {
  try {
    const { contentType, data } = brandAssetUploadSchema.parse(req.body);
    const buffer = Buffer.from(data, "base64");
    if (buffer.length > 8 * 1024 * 1024) {
      throw new AppError("Görsel çok büyük (maks. 8 MB)", 400);
    }
    const { publicUrl, provider } = await storeListingImage(req.user!.id, buffer, contentType);

    await logAdminAction(req.user!.id, "branding.asset_upload", {
      targetType: "branding",
      details: { url: publicUrl, provider },
      ip: clientIp(req),
    });

    res.json({ publicUrl, provider });
  } catch (err) {
    next(err);
  }
});

// ─── Marquee (kayan yazı) ─────────────────────────────────────

router.get("/admin/marquee", adminMiddleware, async (_req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("marquee_items")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    res.json({ items: data ?? [] });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/marquee", adminMiddleware, async (req, res, next) => {
  try {
    const body = z.object({ text: z.string().min(2).max(200), enabled: z.boolean().default(true), sortOrder: z.number().int().optional() }).parse(req.body);
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("marquee_items")
      .insert({ text: body.text, enabled: body.enabled, sort_order: body.sortOrder ?? 0 })
      .select()
      .single();
    if (error || !data) throw new AppError("Eklenemedi", 400);
    await logAdminAction(req.user!.id, "marquee.create", { targetType: "marquee", targetId: data.id, ip: clientIp(req) });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.patch("/admin/marquee/:id", adminMiddleware, async (req, res, next) => {
  try {
    const body = z.object({
      text: z.string().min(2).max(200).optional(),
      enabled: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    }).parse(req.body);
    const id = param(req.params.id);
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.text) update.text = body.text;
    if (body.enabled !== undefined) update.enabled = body.enabled;
    if (body.sortOrder !== undefined) update.sort_order = body.sortOrder;
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from("marquee_items").update(update).eq("id", id).select().single();
    if (error || !data) throw new AppError("Güncellenemedi", 400);
    await logAdminAction(req.user!.id, "marquee.update", { targetType: "marquee", targetId: id, ip: clientIp(req) });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete("/admin/marquee/:id", adminMiddleware, async (req, res, next) => {
  try {
    const id = param(req.params.id);
    const sb = getSupabaseAdmin();
    await sb.from("marquee_items").delete().eq("id", id);
    await logAdminAction(req.user!.id, "marquee.delete", { targetType: "marquee", targetId: id, ip: clientIp(req) });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/live", adminMiddleware, async (_req, res, next) => {
  try {
    const live = await getLiveAnalytics();
    res.json(live);
  } catch (err) {
    next(err);
  }
});

// ─── Audit Log ───────────────────────────────────────────────

router.get("/admin/audit", superAdminMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const { data, error } = await sb
      .from("admin_audit_log")
      .select("*, users(name, email)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    res.json({ items: data ?? [] });
  } catch (err) {
    next(err);
  }
});

export default router;
