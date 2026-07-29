import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import {
  dbSyncUser,
  dbGetUser,
  dbUpdateUser,
  dbGetUserById,
  dbUpdatePushToken,
  dbClearPushToken,
} from "../lib/listings-store";
import { deleteUserAccountCompletely } from "../lib/delete-user-account";
import { authMiddleware } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const router: IRouter = Router();

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).optional(),
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

router.delete("/users/me", authMiddleware, async (req, res, next) => {
  try {
    const body = z
      .object({ confirm: z.literal("DELETE") })
      .parse(req.body ?? {});

    void body;
    const userId = req.user!.id;
    await deleteUserAccountCompletely(userId);
    res.json({
      success: true,
      message: "Hesabınız ve tüm verileriniz kalıcı olarak silindi.",
    });
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
    const body = z
      .object({
        token: z.string().min(1),
        platform: z.enum(["ios", "android", "web"]).optional(),
      })
      .parse(req.body);

    let token = body.token.trim();
    if (body.platform === "web" && !token.startsWith("fcm:")) {
      token = `fcm:${token}`;
    }

    await dbUpdatePushToken(req.user!.id, token);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/users/me/push-token", authMiddleware, async (req, res, next) => {
  try {
    await dbClearPushToken(req.user!.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post("/users/me/heartbeat", authMiddleware, async (req, res, next) => {
  try {
    const body = z
      .object({
        deviceId: z.string().min(8).max(128).optional(),
        platform: z.enum(["ios", "android", "web"]).optional(),
        appVersion: z.string().max(32).optional(),
      })
      .optional()
      .parse(req.body ?? {});

    const { getSupabaseAdmin } = await import("../lib/supabase-db");
    const { upsertDevicePresence } = await import("../lib/presence");
    const now = new Date().toISOString();

    await getSupabaseAdmin()
      .from("users")
      .update({ last_active_at: now, updated_at: now })
      .eq("id", req.user!.id);

    const deviceId =
      body?.deviceId ??
      (typeof req.headers["x-device-id"] === "string" ? req.headers["x-device-id"] : undefined);
    if (deviceId) {
      await upsertDevicePresence(deviceId, {
        userId: req.user!.id,
        platform: body?.platform,
        appVersion: body?.appVersion,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
