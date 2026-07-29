import type { Request, Response, NextFunction } from "express";
import { createHash } from "node:crypto";

type CacheEntry = { body: string; etag: string; expires: number };

const store = new Map<string, CacheEntry>();

export function responseCache(ttlMs: number, match?: (req: Request) => boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== "GET") {
      next();
      return;
    }
    if (match && !match(req)) {
      next();
      return;
    }

    const userKey =
      (req.headers.authorization as string | undefined)?.slice(0, 32) ??
      (req.headers["x-device-id"] as string | undefined) ??
      "anon";
    const key = `${userKey}:${req.originalUrl}`;
    const hit = store.get(key);
    const now = Date.now();

    if (hit && hit.expires > now) {
      if (req.headers["if-none-match"] === hit.etag) {
        res.status(304).end();
        return;
      }
      res.setHeader("ETag", hit.etag);
      res.setHeader("Cache-Control", `private, max-age=${Math.floor((hit.expires - now) / 1000)}`);
      res.setHeader("Content-Type", "application/json");
      res.send(hit.body);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      try {
        const serialized = JSON.stringify(body);
        const etag = `"${createHash("sha1").update(serialized).digest("hex")}"`;
        store.set(key, { body: serialized, etag, expires: now + ttlMs });
        if (store.size > 500) {
          const oldest = [...store.entries()].sort((a, b) => a[1].expires - b[1].expires)[0]?.[0];
          if (oldest) store.delete(oldest);
        }
        res.setHeader("ETag", etag);
        res.setHeader("Cache-Control", `private, max-age=${Math.floor(ttlMs / 1000)}`);
      } catch {
        /* ignore cache write errors */
      }
      return originalJson(body);
    };

    next();
  };
}
