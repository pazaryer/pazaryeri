import type { Request, Response, NextFunction } from "express";
import { verifyFirebaseToken } from "../lib/firebase-admin";
import { getSupabaseAdmin } from "../lib/supabase-db";

export interface AuthUser {
  id: string;
  firebaseUid: string;
  email?: string;
  phone?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Yetkilendirme gerekli" });
    return;
  }

  const token = header.slice(7);

  try {
    const user = await verifyFirebaseToken(token);
    try {
      const sb = getSupabaseAdmin();
      const { data: row } = await sb
        .from("users")
        .select("is_banned")
        .eq("id", user.id)
        .maybeSingle();
      if (row?.is_banned) {
        res.status(403).json({ error: "Hesabınız engellenmiş" });
        return;
      }
    } catch {
      // migration öncesi is_banned sütunu olmayabilir
    }
    req.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      phone: user.phone,
    };
    next();
  } catch {
    res.status(401).json({ error: "Geçersiz token" });
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const user = await verifyFirebaseToken(header.slice(7));
    req.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      phone: user.phone,
    };
  } catch {
    // ignore invalid optional token
  }
  next();
}
