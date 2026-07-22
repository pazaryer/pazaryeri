import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import {
  getSupabaseAdmin,
  ensureUser,
  formatUser,
} from "../lib/supabase-db";
import { authMiddleware } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

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
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

router.post("/users/sync", authMiddleware, async (req, res, next) => {
  try {
    const body = syncUserSchema.parse(req.body);
    const user = await ensureUser(req.user!.id, {
      name: body.name,
      email: body.email ?? req.user!.email,
      phone: body.phone ?? req.user!.phone,
      avatar: body.avatar,
    });
    res.json(formatUser(user));
  } catch (err) {
    next(err);
  }
});

router.get("/users/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await ensureUser(req.user!.id, {
      email: req.user!.email,
      phone: req.user!.phone,
    });
    res.json(formatUser(user));
  } catch (err) {
    next(err);
  }
});

router.put("/users/me", authMiddleware, async (req, res, next) => {
  try {
    const body = updateUserSchema.parse(req.body);
    await ensureUser(req.user!.id);
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("users")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", req.user!.id)
      .select()
      .single();
    if (error || !data) throw new AppError("Kullanıcı bulunamadı", 404);
    res.json(formatUser(data));
  } catch (err) {
    next(err);
  }
});

router.get("/users/:userId", async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from("users").select("*").eq("id", req.params.userId).single();
    if (error || !data) throw new AppError("Kullanıcı bulunamadı", 404);
    res.json(formatUser(data));
  } catch (err) {
    next(err);
  }
});

router.post("/users/me/push-token", authMiddleware, async (req, res, next) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    await getSupabaseAdmin()
      .from("users")
      .update({ push_token: token, updated_at: new Date().toISOString() })
      .eq("id", req.user!.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
