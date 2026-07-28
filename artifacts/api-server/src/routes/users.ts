import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import {
  dbSyncUser,
  dbGetUser,
  dbUpdateUser,
  dbGetUserById,
  dbUpdatePushToken,
} from "../lib/listings-store";
import { authMiddleware } from "../middleware/auth";

const router: IRouter = Router();

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const syncUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  phone: z.string().max(30).optional(),
  avatar: z.union([z.string().url(), z.literal("")]).optional(),
});

router.post("/users/sync", authMiddleware, async (req, res, next) => {
  try {
    const body = syncUserSchema.parse(req.body);
    const user = await dbSyncUser(req.user!.id, {
      name: body.name,
      email: body.email || req.user!.email,
      phone: body.phone ?? req.user!.phone,
      avatar: body.avatar || undefined,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.get("/users/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await dbGetUser(req.user!.id, {
      email: req.user!.email,
      phone: req.user!.phone,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.put("/users/me", authMiddleware, async (req, res, next) => {
  try {
    const body = updateUserSchema.parse(req.body);
    const user = await dbUpdateUser(req.user!.id, body);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.get("/users/:userId", async (req, res, next) => {
  try {
    const user = await dbGetUserById(req.params.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post("/users/me/push-token", authMiddleware, async (req, res, next) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    await dbUpdatePushToken(req.user!.id, token);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post("/users/me/heartbeat", authMiddleware, async (req, res, next) => {
  try {
    const { getSupabaseAdmin } = await import("../lib/supabase-db");
    await getSupabaseAdmin()
      .from("users")
      .update({ last_active_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", req.user!.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
