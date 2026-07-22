import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import {
  getSupabaseAdmin,
  formatListingSummary,
  getFavoriteSet,
  getListingImages,
  type DbListing,
  type DbUser,
} from "../lib/supabase-db";
import { authMiddleware } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const router: IRouter = Router();

router.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json({ items: [], hasMore: false, nextCursor: null });

    const sb = getSupabaseAdmin();
    const { data: rows } = await sb
      .from("listings")
      .select("*, users!listings_seller_id_fkey(*)")
      .eq("status", "active")
      .ilike("title", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    const listingIds = (rows ?? []).map((r) => r.id);
    const imageMap = await getListingImages(listingIds);
    const favSet = await getFavoriteSet(undefined, listingIds);

    const items = await Promise.all(
      (rows ?? []).map((row) =>
        formatListingSummary(
          row as DbListing,
          row.users as DbUser,
          imageMap.get(row.id)?.[0] ?? "",
          favSet.has(row.id),
        ),
      ),
    );

    res.json({ items, hasMore: false, nextCursor: null });
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

    const items = await Promise.all(
      (favs ?? []).map(async (f) => {
        const listing = (f as any).listings as DbListing & { users: DbUser };
        const imageMap = await getListingImages([listing.id]);
        return formatListingSummary(listing, listing.users, imageMap.get(listing.id)?.[0] ?? "", true);
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
    await getSupabaseAdmin().from("blocks").insert({
      blocker_id: req.user!.id,
      blocked_id: req.params.userId,
    });
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
        isRead: n.is_read === "true",
        createdAt: n.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/notifications/:notificationId/read", authMiddleware, async (req, res, next) => {
  try {
    await getSupabaseAdmin()
      .from("notifications")
      .update({ is_read: "true" })
      .eq("id", req.params.notificationId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
