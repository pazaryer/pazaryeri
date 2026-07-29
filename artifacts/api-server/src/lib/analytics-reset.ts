import { getSupabaseAdmin } from "./supabase-db";
import { getAppConfig, setAppConfig } from "./app-config";

const RESET_KEY = "analytics.resetAt";

export async function getAnalyticsResetAt(): Promise<string | null> {
  const config = await getAppConfig();
  const v = config[RESET_KEY];
  return typeof v === "string" && v ? v : null;
}

/** Canlı istatistikleri sıfırla — kullanıcı/ilan verisi silinmez */
export async function resetLiveAnalytics(adminId: string): Promise<{ resetAt: string }> {
  const sb = getSupabaseAdmin();
  const resetAt = new Date().toISOString();

  await Promise.all([
    sb.from("device_presence").delete().neq("device_id", ""),
    sb.from("listing_views").delete().neq("listing_id", ""),
  ]);

  await setAppConfig(RESET_KEY, resetAt, adminId, "Analitik sıfırlama zamanı");

  return { resetAt };
}

export function effectiveSince(resetAt: string | null, fallback: string): string {
  if (!resetAt) return fallback;
  return resetAt > fallback ? resetAt : fallback;
}
