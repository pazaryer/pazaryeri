-- Pazaryeri v2: Teklifler + cihaz bazlı görüntülenme
-- Supabase SQL Editor'de çalıştırın (setup.sql sonrası)

CREATE TABLE IF NOT EXISTS listing_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(listing_id, device_id)
);

CREATE INDEX IF NOT EXISTS listing_views_listing_idx ON listing_views(listing_id);

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  offered_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  parent_offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offers_listing_idx ON offers(listing_id);
CREATE INDEX IF NOT EXISTS offers_buyer_idx ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS offers_seller_idx ON offers(seller_id);
CREATE INDEX IF NOT EXISTS offers_status_idx ON offers(status);
