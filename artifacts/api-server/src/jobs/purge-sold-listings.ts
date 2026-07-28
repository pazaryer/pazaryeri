import { getSupabaseAdmin } from "../lib/supabase-db";
import { logger } from "../lib/logger";
import { purgeListingCompletely } from "../lib/purge-listing";

const SOLD_RETENTION_DAYS = 2;
const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 saatte bir

export async function purgeSoldListings(): Promise<number> {
  const cutoff = new Date(Date.now() - SOLD_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("listings")
    .select("id")
    .eq("status", "sold")
    .not("sold_at", "is", null)
    .lt("sold_at", cutoff);

  if (error) {
    logger.error({ err: error.message }, "purgeSoldListings failed");
    return 0;
  }

  let count = 0;
  for (const row of data ?? []) {
    try {
      await purgeListingCompletely(row.id);
      count++;
    } catch (err) {
      logger.error({ err, listingId: row.id }, "purgeSoldListings item failed");
    }
  }

  if (count > 0) {
    logger.info({ count, cutoff }, "Hard-deleted sold listings older than 2 days");
  }
  return count;
}

export function startSoldListingPurgeScheduler(): void {
  const run = () => {
    purgeSoldListings().catch((err) => {
      logger.error({ err }, "Scheduled purgeSoldListings error");
    });
  };

  setTimeout(run, 60_000);
  setInterval(run, INTERVAL_MS);
  logger.info("Sold listing purge scheduler started (every 6h, 2-day retention, hard delete)");
}
