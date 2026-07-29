-- Teklif kabulü: sadece onaylanan alıcıya özel fiyat
ALTER TABLE listings ADD COLUMN IF NOT EXISTS accepted_buyer_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS accepted_offer_price INTEGER;

-- Çift sohbet önleme
CREATE UNIQUE INDEX IF NOT EXISTS conversations_listing_buyer_unique ON conversations(listing_id, buyer_id);

-- Engelleme tekrarı önleme
CREATE UNIQUE INDEX IF NOT EXISTS blocks_pair_unique ON blocks(blocker_id, blocked_id);

-- İlan yorumları (herkese açık)
CREATE TABLE IF NOT EXISTS listing_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 2 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_comments_listing_idx ON listing_comments(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS listing_comments_user_idx ON listing_comments(user_id);

-- Dağıtık rate limit (Render çok instance / restart)
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limit_reset_idx ON rate_limit_buckets(reset_at);
