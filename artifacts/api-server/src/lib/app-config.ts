import { getSupabaseAdmin } from "./supabase-db";
import { DEFAULT_APP_CONFIG } from "./app-config-defaults";

let cache: { data: Record<string, unknown>; at: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getAppConfig(key?: string): Promise<Record<string, unknown>> {
  const now = Date.now();
  if (!cache || now - cache.at > CACHE_TTL_MS) {
    const sb = getSupabaseAdmin();
    const { data: rows } = await sb.from("app_config").select("key, value");
    const merged: Record<string, unknown> = { ...DEFAULT_APP_CONFIG };
    for (const row of rows ?? []) {
      merged[row.key] = row.value;
    }
    cache = { data: merged, at: now };
  }
  if (key) {
    return { [key]: cache.data[key] ?? DEFAULT_APP_CONFIG[key] ?? null };
  }
  return { ...cache.data };
}

export function invalidateAppConfigCache(): void {
  cache = null;
}

export async function setAppConfig(
  key: string,
  value: unknown,
  adminId: string,
  description?: string,
): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("app_config").upsert(
    {
      key,
      value,
      description: description ?? null,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
  invalidateAppConfigCache();
}

export async function deleteAppConfigKey(key: string): Promise<void> {
  const sb = getSupabaseAdmin();
  await sb.from("app_config").delete().eq("key", key);
  invalidateAppConfigCache();
}
