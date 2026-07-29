import { getSupabaseAdmin } from "./supabase-db";

export async function logAdminAction(
  adminId: string,
  action: string,
  opts?: {
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    ip?: string;
  },
): Promise<void> {
  try {
    const sb = getSupabaseAdmin();
    await sb.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      target_type: opts?.targetType ?? null,
      target_id: opts?.targetId ?? null,
      details: opts?.details ?? null,
      ip_address: opts?.ip ?? null,
    });
  } catch {
    // audit failure must not block admin ops
  }
}
