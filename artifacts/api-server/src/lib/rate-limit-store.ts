import { getSupabaseAdmin } from "./supabase-db";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

const memoryHits = new Map<string, { count: number; resetAt: number }>();

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
  const dbResult = await checkSupabaseBucket(key);
  if (dbResult !== null) return dbResult;
  return checkMemoryBucket(key);
}
