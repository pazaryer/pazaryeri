import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { getSupabaseAdmin, ensureUser } from "../lib/supabase-db";
import { authMiddleware } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { notifyUser } from "../lib/notify";

const router: IRouter = Router();

const createReviewSchema = z.object({
  revieweeId: z.string().uuid(),
  listingId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).default(""),
});

router.get("/reviews/user/:userId", async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: rows } = await sb
      .from("reviews")
      .select("*, users!reviews_reviewer_id_fkey(id, name, avatar)")
      .eq("reviewee_id", req.params.userId)
      .order("created_at", { ascending: false })
      .limit(50);

    res.json({
      items: (rows ?? []).map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        listingId: r.listing_id,
        createdAt: r.created_at,
        reviewer: {
          id: (r as { users?: { id: string; name: string; avatar?: string } }).users?.id,
          name: (r as { users?: { id: string; name: string; avatar?: string } }).users?.name ?? "Kullanıcı",
          avatar: (r as { users?: { id: string; avatar?: string } }).users?.avatar ?? null,
        },
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/reviews", authMiddleware, async (req, res, next) => {
  try {
    const body = createReviewSchema.parse(req.body);
    const userId = req.user!.id;
    if (body.revieweeId === userId) throw new AppError("Kendinizi değerlendiremezsiniz", 400);

    await ensureUser(userId);
    const sb = getSupabaseAdmin();

    if (body.listingId) {
      const { data: listing } = await sb.from("listings").select("seller_id, title").eq("id", body.listingId).single();
      if (!listing) throw new AppError("İlan bulunamadı", 404);
      if (listing.seller_id !== body.revieweeId) throw new AppError("Bu ilan bu satıcıya ait değil", 400);
    }

    const { data: review, error } = await sb
      .from("reviews")
      .insert({
        reviewer_id: userId,
        reviewee_id: body.revieweeId,
        listing_id: body.listingId ?? null,
        rating: body.rating,
        comment: body.comment,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") throw new AppError("Bu ilan için zaten değerlendirme yaptınız", 400);
      throw new Error(error.message);
    }

    const { data: allReviews } = await sb.from("reviews").select("rating").eq("reviewee_id", body.revieweeId);
    const ratings = (allReviews ?? []).map((r) => r.rating);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    await sb
      .from("users")
      .update({
        rating: Math.round(avg * 10) / 10,
        total_sales: ratings.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.revieweeId);

    await notifyUser({
      userId: body.revieweeId,
      type: "review",
      title: "Yeni Değerlendirme",
      body: `${body.rating} yıldız aldınız`,
      data: { revieweeId: body.revieweeId, listingId: body.listingId ?? "" },
    });

    res.status(201).json({
      id: review!.id,
      rating: review!.rating,
      comment: review!.comment,
      createdAt: review!.created_at,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
