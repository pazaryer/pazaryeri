-- Satıldı ilanlar 2 gün sonra otomatik silinir (API scheduler)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS listings_sold_at_idx ON listings(sold_at) WHERE status = 'sold';

-- Mevcut satıldı ilanlar için sold_at doldur
UPDATE listings SET sold_at = updated_at WHERE status = 'sold' AND sold_at IS NULL;
