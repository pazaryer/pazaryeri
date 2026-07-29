import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { getSupabaseAdmin } from "../lib/supabase-db";
import { upsertDevicePresence } from "../lib/presence";
import { optionalAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/marquee", async (_req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("marquee_items")
      .select("id, text, sort_order")
      .eq("enabled", true)
      .order("sort_order", { ascending: true });

    if (error) {
      if (error.message.includes("does not exist")) {
        res.json({ items: [], enabled: false });
        return;
      }
      throw new Error(error.message);
    }

    res.json({
      enabled: (data ?? []).length > 0,
      items: (data ?? []).map((r) => ({ id: r.id, text: r.text })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/presence/ping", optionalAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        deviceId: z.string().min(8).max(128),
        platform: z.enum(["ios", "android", "web", "admin"]).optional(),
        appVersion: z.string().max(32).optional(),
      })
      .parse(req.body);

    await upsertDevicePresence(body.deviceId, {
      userId: req.user?.id,
      platform: body.platform,
      appVersion: body.appVersion,
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
