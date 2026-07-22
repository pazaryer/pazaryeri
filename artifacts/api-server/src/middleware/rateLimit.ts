import type { Request, Response, NextFunction } from "express";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = req.user?.id ?? req.ip ?? "anonymous";
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (entry.count >= MAX_REQUESTS) {
    res.status(429).json({ error: "Çok fazla istek. Lütfen bekleyin." });
    return;
  }

  entry.count++;
  next();
}
