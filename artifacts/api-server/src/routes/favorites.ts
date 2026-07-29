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

    const [{ data: listing }, { data: favoriter }] = await Promise.all([
      sb.from("listings").select("seller_id, title").eq("id", listingId).single(),
      sb.from("users").select("name, avatar").eq("id", userId).single(),
    ]);

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
        const favoriterName = favoriter?.name ?? "Bir kullanıcı";
        await notifyUser({
          userId: listing.seller_id,
          type: "favorite",
          title: favoriterName,
          subtitle: listing.title,
          body: `"${listing.title}" ilanınızı favorilere ekledi`,
          data: {
            listingId,
            favoriterId: userId,
            favoriterName,
            listingTitle: listing.title,
          },
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
