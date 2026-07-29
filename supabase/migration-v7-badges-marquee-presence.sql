-- Rozetler, kayan yazı, cihaz bazlı presence, ilan görüntüleme zamanı

ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_emoji TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_label TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_color TEXT DEFAULT '#2E90FA';

CREATE TABLE IF NOT EXISTS marquee_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS marquee_items_enabled_idx ON marquee_items(enabled, sort_order);

CREATE TABLE IF NOT EXISTS device_presence (
  device_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform TEXT,
  app_version TEXT,
  last_ping_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS device_presence_last_ping_idx ON device_presence(last_ping_at DESC);
CREATE INDEX IF NOT EXISTS device_presence_user_idx ON device_presence(user_id);

ALTER TABLE listing_views ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE INDEX IF NOT EXISTS listing_views_last_viewed_idx ON listing_views(last_viewed_at DESC);

-- Varsayılan kayan yazılar (tablo boşsa)
INSERT INTO marquee_items (text, enabled, sort_order)
SELECT v.text, true, v.ord FROM (VALUES
  ('Ücretsiz ilan ver — komisyon yok, hemen sat!', 1),
  ('Yakınındaki fırsatları kaçırma, keşfet', 2),
  ('Mesaj ve teklifler anında cebinde', 3),
  ('Güvenli ikinci el alışveriş — doğrudan mesajlaş', 4),
  ('Bugün ilan ver, yarın kazan', 5),
  ('Binlerce ilan seni bekliyor', 6)
) AS v(text, ord)
WHERE NOT EXISTS (SELECT 1 FROM marquee_items LIMIT 1);
