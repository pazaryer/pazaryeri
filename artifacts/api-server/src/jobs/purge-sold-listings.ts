import { getSupabaseAdmin } from "../lib/supabase-db";
import { logger } from "../lib/logger";

const SOLD_RETENTION_DAYS = 2;
const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 saatte bir

export async function purgeSoldListings(): Promise<number> {
  const cutoff = new Date(Date.now() - SOLD_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("listings")
    .update({ status: "deleted", updated_at: new Date().toISOString() })
    .eq("status", "sold")
    .not("sold_at", "is", null)
    .lt("sold_at", cutoff)
    .select("id");

  if (error) {
    logger.error({ err: error.message }, "purgeSoldListings failed");
    return 0;
  }

  const count = data?.length ?? 0;
  if (count > 0) {
    logger.info({ count, cutoff }, "Purged sold listings older than 2 days");
  }
  return count;
}

export function startSoldListingPurgeScheduler(): void {
  const run = () => {
    purgeSoldListings().catch((err) => {
      logger.error({ err }, "Scheduled purgeSoldListings error");
    });
  };

  // İlk çalıştırma: sunucu ayağa kalktıktan 60 sn sonra
  setTimeout(run, 60_000);
  setInterval(run, INTERVAL_MS);
  logger.info("Sold listing purge scheduler started (every 6h, 2-day retention)");
}
