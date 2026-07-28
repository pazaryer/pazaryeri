import { Router, type IRouter } from "express";
import { getSupabaseAdmin } from "../lib/supabase-db";
import { authMiddleware } from "../middleware/auth";
import { notifyUser } from "../lib/notify";

const router: IRouter = Router();

router.post("/favorites/:listingId", authMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const listingId = req.params.listingId;
    const userId = req.user!.id;

    const { data: listing } = await sb.from("listings").select("seller_id, title").eq("id", listingId).single();

    const { data: existing } = await sb
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("listing_id", listingId)
      .maybeSingle();

    if (!existing) {
      const { error } = await sb.from("favorites").insert({ user_id: userId, listing_id: listingId });
      if (error) throw new Error(error.message);

      if (listing && listing.seller_id !== userId) {
        await notifyUser({
          userId: listing.seller_id,
          type: "favorite",
          title: "İlan Favorilere Eklendi",
          body: `"${listing.title}" ilanınız favorilere eklendi`,
          data: { listingId },
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/favorites/:listingId", authMiddleware, async (req, res, next) => {
  try {
    await getSupabaseAdmin()
      .from("favorites")
      .delete()
      .eq("user_id", req.user!.id)
      .eq("listing_id", req.params.listingId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
