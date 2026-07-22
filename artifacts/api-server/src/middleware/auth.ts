import type { Request, Response, NextFunction } from "express";
import { verifyFirebaseToken } from "../lib/firebase-admin";

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
