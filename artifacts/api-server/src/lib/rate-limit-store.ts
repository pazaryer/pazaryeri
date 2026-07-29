import { getSupabaseAdmin } from "./supabase-db";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 180;

const memoryHits = new Map<string, { count: number; resetAt: number }>();

async function checkSupabaseRpc(key: string): Promise<boolean | null> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.rpc("consume_rate_limit", {
      p_key: key,
      p_window_ms: WINDOW_MS,
      p_max: MAX_REQUESTS,
    });
    if (error) return null;
    return data === true;
  } catch {
    return null;
  }
}

async function checkSupabaseBucket(key: string): Promise<boolean | null> {
  try {
    const sb = getSupabaseAdmin();
    const now = new Date();
    const resetAt = new Date(now.getTime() + WINDOW_MS);

    const { data: existing } = await sb
      .from("rate_limit_buckets")
      .select("count, reset_at")
      .eq("bucket_key", key)
      .maybeSingle();

    if (!existing || new Date(existing.reset_at) < now) {
      await sb.from("rate_limit_buckets").upsert({
        bucket_key: key,
        count: 1,
        reset_at: resetAt.toISOString(),
      });
      return true;
    }

    if (existing.count >= MAX_REQUESTS) return false;

    await sb
      .from("rate_limit_buckets")
      .update({ count: existing.count + 1 })
      .eq("bucket_key", key);
    return true;
  } catch {
    return null;
  }
}

function checkMemoryBucket(key: string): boolean {
  const now = Date.now();
  const entry = memoryHits.get(key);

  if (!entry || now > entry.resetAt) {
    memoryHits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

export async function consumeRateLimit(key: string): Promise<boolean> {
  const rpcResult = await checkSupabaseRpc(key);
  if (rpcResult !== null) return rpcResult;
  const dbResult = await checkSupabaseBucket(key);
  if (dbResult !== null) return dbResult;
  return checkMemoryBucket(key);
}
