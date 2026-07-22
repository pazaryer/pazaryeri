import { Router, type IRouter } from "express";
import { getSupabaseAdmin } from "../lib/supabase-db";
import { authMiddleware } from "../middleware/auth";

const router: IRouter = Router();

router.post("/favorites/:listingId", authMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("favorites").upsert(
      { user_id: req.user!.id, listing_id: req.params.listingId },
      { onConflict: "user_id,listing_id", ignoreDuplicates: true },
    );
    if (error) throw new Error(error.message);
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
