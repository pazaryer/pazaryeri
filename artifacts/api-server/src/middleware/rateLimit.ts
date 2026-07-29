import type { Request, Response, NextFunction } from "express";
import { consumeRateLimit } from "../lib/rate-limit-store";

export async function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const key = req.user?.id ?? req.ip ?? "anonymous";
    const allowed = await consumeRateLimit(key);
    if (!allowed) {
      res.status(429).json({ error: "Çok fazla istek. Lütfen bekleyin." });
      return;
    }
    next();
  } catch {
    next();
  }
}
