import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { dbListListings } from "../lib/listings-store";
import { authMiddleware } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getSupabaseAdmin } from "../lib/supabase-db";
import {
  formatListingSummary,
  getFavoriteSet,
  getFavoriteCountsMap,
  getListingImages,
  type DbListing,
  type DbUser,
} from "../lib/supabase-db";

const router: IRouter = Router();

function parseNotificationIsRead(value: unknown): boolean {
  return value === true || value === "true";
}

router.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json({ items: [], hasMore: false, nextCursor: null });
    const result = await dbListListings({ limit: 20, q });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/favorites", authMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: favs } = await sb
      .from("favorites")
      .select("listing_id, listings(*, users!listings_seller_id_fkey(*))")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false });

    const listingIds = (favs ?? []).map((f) => (f as { listings: DbListing }).listings.id);
    const favCounts = await getFavoriteCountsMap(listingIds);

    const items = await Promise.all(
      (favs ?? []).map(async (f) => {
        const listing = (f as { listings: DbListing & { users: DbUser } }).listings;
        const imageMap = await getListingImages([listing.id]);
        return formatListingSummary(
          listing,
          listing.users,
          imageMap.get(listing.id)?.[0] ?? "",
          true,
          null,
          null,
          favCounts.get(listing.id) ?? 0,
          req.user!.id,
        );
      }),
    );

    res.json({ items, hasMore: false, nextCursor: null });
  } catch (err) {
    next(err);
  }
});

router.post("/reports", authMiddleware, async (req, res, next) => {
  try {
    const body = z.object({
      listingId: z.string().uuid().optional(),
      reportedUserId: z.string().uuid().optional(),
      reason: z.string().min(1),
      description: z.string().optional(),
    }).parse(req.body);

    if (!body.listingId && !body.reportedUserId) throw new AppError("İlan veya kullanıcı belirtilmeli", 400);

    await getSupabaseAdmin().from("reports").insert({
      reporter_id: req.user!.id,
      listing_id: body.listingId,
      reported_user_id: body.reportedUserId,
      reason: body.reason,
      description: body.description,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post("/blocks/:userId", authMiddleware, async (req, res, next) => {
  try {
    if (req.params.userId === req.user!.id) throw new AppError("Kendinizi engelleyemezsiniz", 400);
    const { error } = await getSupabaseAdmin().from("blocks").insert({
      blocker_id: req.user!.id,
      blocked_id: req.params.userId,
    });
    if (error && error.code !== "23505") throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/blocks/:userId", authMiddleware, async (req, res, next) => {
  try {
    await getSupabaseAdmin()
      .from("blocks")
      .delete()
      .eq("blocker_id", req.user!.id)
      .eq("blocked_id", req.params.userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get("/notifications", authMiddleware, async (req, res, next) => {
  try {
    const { data } = await getSupabaseAdmin()
      .from("notifications")
      .select("*")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false })
      .limit(50);

    res.json({
      items: (data ?? []).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        isRead: parseNotificationIsRead(n.is_read),
        createdAt: n.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/notifications/read-all", authMiddleware, async (req, res, next) => {
  try {
    const { data } = await getSupabaseAdmin()
      .from("notifications")
      .select("id, is_read")
      .eq("user_id", req.user!.id);

    const unreadIds = (data ?? [])
      .filter((n) => !parseNotificationIsRead(n.is_read))
      .map((n) => n.id);

    if (unreadIds.length > 0) {
      await getSupabaseAdmin()
        .from("notifications")
        .update({ is_read: "true" })
        .in("id", unreadIds);
    }

    res.json({ success: true, updated: unreadIds.length });
  } catch (err) {
    next(err);
  }
});

router.delete("/notifications/all", authMiddleware, async (req, res, next) => {
  try {
    const { error, count } = await getSupabaseAdmin()
      .from("notifications")
      .delete({ count: "exact" })
      .eq("user_id", req.user!.id);

    if (error) throw error;
    res.json({ success: true, deleted: count ?? 0 });
  } catch (err) {
    next(err);
  }
});

/** DELETE bazı istemcilerde sorun çıkarırsa yedek */
router.post("/notifications/clear-all", authMiddleware, async (req, res, next) => {
  try {
    const { error, count } = await getSupabaseAdmin()
      .from("notifications")
      .delete({ count: "exact" })
      .eq("user_id", req.user!.id);

    if (error) throw error;
    res.json({ success: true, deleted: count ?? 0 });
  } catch (err) {
    next(err);
  }
});

router.patch("/notifications/:notificationId/read", authMiddleware, async (req, res, next) => {
  try {
    const { data } = await getSupabaseAdmin()
      .from("notifications")
      .update({ is_read: "true" })
      .eq("id", req.params.notificationId)
      .eq("user_id", req.user!.id)
      .select("id");

    if (!data?.length) throw new AppError("Bildirim bulunamadı", 404);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
