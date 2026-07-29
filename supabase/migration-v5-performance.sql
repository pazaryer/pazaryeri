-- Performans + arama + bildirim tutarlılığı (1k aktif kullanıcı / milyonlarca ilan)

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Bildirim is_read: TEXT → BOOLEAN
ALTER TABLE notifications ALTER COLUMN is_read DROP DEFAULT;
ALTER TABLE notifications
  ALTER COLUMN is_read TYPE BOOLEAN
  USING (
    CASE
      WHEN is_read IS NULL THEN false
      WHEN lower(trim(is_read::text)) IN ('true', 't', '1') THEN true
      ELSE false
    END
  );
ALTER TABLE notifications ALTER COLUMN is_read SET DEFAULT false;

-- Tam metin arama (başlık + açıklama + kategori)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS listings_search_vector_idx ON listings USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS listings_title_trgm_idx ON listings USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS listings_description_trgm_idx ON listings USING GIN (description gin_trgm_ops);

-- Konum / liste sorguları
CREATE INDEX IF NOT EXISTS listings_geo_active_idx ON listings (latitude, longitude)
  WHERE status = 'active' AND latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS listings_seller_created_idx ON listings (seller_id, created_at DESC)
  WHERE status <> 'deleted';

CREATE INDEX IF NOT EXISTS listings_active_created_idx ON listings (created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS listings_active_price_idx ON listings (price ASC, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS listings_active_price_desc_idx ON listings (price DESC, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications (user_id, created_at DESC);

-- Atomik rate limit (çok instance)
CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_key text,
  p_window_ms integer DEFAULT 60000,
  p_max integer DEFAULT 180
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_now timestamptz := now();
  v_reset timestamptz := v_now + (p_window_ms || ' milliseconds')::interval;
  v_count integer;
BEGIN
  INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
  VALUES (p_key, 1, v_reset)
  ON CONFLICT (bucket_key) DO UPDATE
  SET
    count = CASE
      WHEN rate_limit_buckets.reset_at < v_now THEN 1
      ELSE rate_limit_buckets.count + 1
    END,
    reset_at = CASE
      WHEN rate_limit_buckets.reset_at < v_now THEN v_reset
      ELSE rate_limit_buckets.reset_at
    END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;
