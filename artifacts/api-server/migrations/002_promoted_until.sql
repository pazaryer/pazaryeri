-- İlan öne çıkarma (ödüllü reklam sonrası 2 saat)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS promoted_until TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_listings_promoted_until ON listings (promoted_until DESC NULLS LAST);
