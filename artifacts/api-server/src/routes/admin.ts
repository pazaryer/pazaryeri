import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { adminMiddleware, superAdminMiddleware } from "../middleware/adminAuth";
import { AppError } from "../middleware/errorHandler";
import { getSupabaseAdmin } from "../lib/supabase-db";
import { logAdminAction } from "../lib/admin-audit";
import {
  getAppConfig,
  setAppConfig,
  deleteAppConfigKey,
} from "../lib/app-config";
import { CONFIG_KEYS, DEFAULT_APP_CONFIG } from "../lib/app-config-defaults";
import { purgeListingCompletely } from "../lib/purge-listing";
import { dbBuildListingDetail } from "../lib/listings-store";
import { getLiveAnalytics } from "../lib/presence";

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
      })
      .parse(req.body);

    const sb = getSupabaseAdmin();
    const { data: comment, error } = await sb
      .from("listing_comments")
      .insert({
        listing_id: body.listingId,
        user_id: req.user!.id,
        content: body.content.trim(),
      })
      .select("*, users(id, name, avatar)")
      .single();

    if (error || !comment) throw new AppError("Yorum eklenemedi", 400);

    await logAdminAction(req.user!.id, "comment.create", {
      targetType: "comment",
      targetId: comment.id,
      details: { listingId: body.listingId },
      ip: clientIp(req),
    });

    res.status(201).json(comment);
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
