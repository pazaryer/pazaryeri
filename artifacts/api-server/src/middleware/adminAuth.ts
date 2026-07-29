import type { Request, Response, NextFunction } from "express";
import { authMiddleware } from "./auth";
import { getSupabaseAdmin } from "../lib/supabase-db";

export type AdminRole = "moderator" | "admin";

declare global {
  namespace Express {
    interface Request {
      adminRole?: AdminRole;
    }
  }
}

function parseBootstrapEmails(): Set<string> {
  const raw = process.env.ADMIN_BOOTSTRAP_EMAILS ?? "";
  const fromEnv = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (fromEnv.length > 0) return new Set(fromEnv);
  return new Set(["pazaryer0@gmail.com"]);
}

async function resolveUserRole(
  userId: string,
  email?: string,
): Promise<{ role: string; isBanned: boolean }> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("users")
    .select("role, is_banned")
    .eq("id", userId)
    .maybeSingle();

  let role = data?.role ?? "user";
  const isBanned = data?.is_banned ?? false;

  const bootstrap = parseBootstrapEmails();
  if (email && bootstrap.has(email.toLowerCase()) && role === "user") {
    role = "admin";
    await sb.from("users").update({ role: "admin" }).eq("id", userId);
  }

  return { role, isBanned };
}

export function requireAdmin(minRole: AdminRole = "moderator") {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await authMiddleware(req, res, async () => {
      if (!req.user) return;

      try {
        const { role, isBanned } = await resolveUserRole(req.user.id, req.user.email);
        if (isBanned) {
          res.status(403).json({ error: "Hesabınız engellenmiş" });
          return;
        }

        const roleRank = { user: 0, moderator: 1, admin: 2 };
        const needed = roleRank[minRole];
        const actual = roleRank[role as keyof typeof roleRank] ?? 0;

        if (actual < needed) {
          res.status(403).json({ error: "Admin yetkisi gerekli" });
          return;
        }

        req.adminRole = role as AdminRole;
        next();
      } catch {
        res.status(500).json({ error: "Yetki kontrolü başarısız" });
      }
    });
  };
}

export const adminMiddleware = requireAdmin("moderator");
export const superAdminMiddleware = requireAdmin("admin");
