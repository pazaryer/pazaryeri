import { logger } from "./logger";

/** Sunucu açılışında promoted_until sütununu garanti et (migration atlanmışsa). */
export async function ensurePromotedColumn(): Promise<void> {
  try {
    const { getPgPool } = await import("./postgres-db");
    const db = getPgPool();
    await db.query(`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS promoted_until TIMESTAMPTZ;
      CREATE INDEX IF NOT EXISTS idx_listings_promoted_until ON listings (promoted_until DESC NULLS LAST);
    `);
    logger.info("promoted_until column ensured");
  } catch (err) {
    logger.warn({ err }, "promoted_until ensure skipped (postgres may be unused)");
  }
}
