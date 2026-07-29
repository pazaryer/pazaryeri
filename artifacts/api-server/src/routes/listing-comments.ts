import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { getSupabaseAdmin, ensureUser } from "../lib/supabase-db";
import { authMiddleware, optionalAuth } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { assertNotBlocked } from "../lib/blocks";

const router: IRouter = Router();

const commentSchema = z.object({
  content: z.string().min(2).max(1000),
});

router.get("/listings/:listingId/comments", optionalAuth, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const listingId = req.params.listingId;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const { data: listing } = await sb.from("listings").select("id, status").eq("id", listingId).single();
    if (!listing || listing.status === "deleted") throw new AppError("İlan bulunamadı", 404);

    const { data: rows, error } = await sb
      .from("listing_comments")
      .select("*, users(id, name, avatar)")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    res.json({
      items: (rows ?? []).map((row) => ({
        id: row.id,
        listingId: row.listing_id,
        content: row.content,
        createdAt: row.created_at,
        user: {
          id: (row.users as { id: string }).id,
          name: (row.users as { name: string }).name,
          avatar: (row.users as { avatar?: string | null }).avatar ?? null,
        },
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/listings/:listingId/comments", authMiddleware, async (req, res, next) => {
  try {
    const body = commentSchema.parse(req.body);
    const userId = req.user!.id;
    const listingId = req.params.listingId;
    const sb = getSupabaseAdmin();

    const { data: listing } = await sb
      .from("listings")
      .select("id, seller_id, status")
      .eq("id", listingId)
      .single();
    if (!listing || listing.status === "deleted") throw new AppError("İlan bulunamadı", 404);

    await ensureUser(userId);
    await assertNotBlocked(sb, userId, listing.seller_id);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await sb
      .from("listing_comments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneHourAgo);
    if ((count ?? 0) >= 20) throw new AppError("Çok fazla yorum gönderdiniz. Lütfen bekleyin.", 429);

    const { data: comment, error } = await sb
      .from("listing_comments")
      .insert({
        listing_id: listingId,
        user_id: userId,
        content: body.content.trim(),
      })
      .select("*, users(id, name, avatar)")
      .single();

    if (error || !comment) throw new Error(error?.message ?? "Yorum kaydedilemedi");

    res.status(201).json({
      id: comment.id,
      listingId: comment.listing_id,
      content: comment.content,
      createdAt: comment.created_at,
      user: {
        id: (comment.users as { id: string }).id,
        name: (comment.users as { name: string }).name,
        avatar: (comment.users as { avatar?: string | null }).avatar ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/listings/:listingId/comments/:commentId", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const sb = getSupabaseAdmin();

    const { data: comment } = await sb
      .from("listing_comments")
      .select("*, listings(seller_id)")
      .eq("id", req.params.commentId)
      .eq("listing_id", req.params.listingId)
      .single();

    if (!comment) throw new AppError("Yorum bulunamadı", 404);

    const sellerId = (comment.listings as { seller_id: string }).seller_id;
    if (comment.user_id !== userId && sellerId !== userId) {
      throw new AppError("Yetkisiz", 403);
    }

    await sb.from("listing_comments").delete().eq("id", comment.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
