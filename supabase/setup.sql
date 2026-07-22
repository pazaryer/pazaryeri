-- Pazaryeri - Tam Veritabanı Kurulumu
-- Supabase Dashboard > SQL Editor'de çalıştırın

-- ============================================================
-- TABLOLAR
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT,
  phone TEXT,
  name TEXT NOT NULL DEFAULT 'Kullanıcı',
  avatar TEXT,
  bio TEXT,
  city TEXT,
  district TEXT,
  latitude REAL,
  longitude REAL,
  rating REAL NOT NULL DEFAULT 0,
  total_sales REAL NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  push_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  city TEXT,
  district TEXT,
  location TEXT,
  latitude REAL,
  longitude REAL,
  accepts_offers BOOLEAN NOT NULL DEFAULT true,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listings_seller_idx ON listings(seller_id);
CREATE INDEX IF NOT EXISTS listings_category_idx ON listings(category);
CREATE INDEX IF NOT EXISTS listings_status_idx ON listings(status);
CREATE INDEX IF NOT EXISTS listings_created_idx ON listings(created_at);
CREATE INDEX IF NOT EXISTS listings_price_idx ON listings(price);

CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_images_listing_idx ON listing_images(listing_id);

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversations_buyer_idx ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS conversations_seller_idx ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS conversations_listing_idx ON conversations(listing_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_idx ON messages(created_at);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data TEXT,
  is_read TEXT NOT NULL DEFAULT 'false',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STORAGE
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- REALTIME
-- ============================================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Herkes profilleri görebilir" ON users;
DROP POLICY IF EXISTS "Kullanıcı kendi profilini oluşturabilir" ON users;
DROP POLICY IF EXISTS "Kullanıcı kendi profilini güncelleyebilir" ON users;
DROP POLICY IF EXISTS "Aktif ilanlar herkese açık" ON listings;
DROP POLICY IF EXISTS "Kullanıcı ilan oluşturabilir" ON listings;
DROP POLICY IF EXISTS "Satıcı ilanını güncelleyebilir" ON listings;
DROP POLICY IF EXISTS "Satıcı ilanını silebilir" ON listings;
DROP POLICY IF EXISTS "Görseller herkese açık" ON listing_images;
DROP POLICY IF EXISTS "Satıcı görsel ekleyebilir" ON listing_images;
DROP POLICY IF EXISTS "Kullanıcı favorilerini görebilir" ON favorites;
DROP POLICY IF EXISTS "Kullanıcı favori ekleyebilir" ON favorites;
DROP POLICY IF EXISTS "Kullanıcı favori silebilir" ON favorites;
DROP POLICY IF EXISTS "Katılımcılar sohbeti görebilir" ON conversations;
DROP POLICY IF EXISTS "Kullanıcı sohbet başlatabilir" ON conversations;
DROP POLICY IF EXISTS "Katılımcılar mesajları görebilir" ON messages;
DROP POLICY IF EXISTS "Katılımcılar mesaj gönderebilir" ON messages;
DROP POLICY IF EXISTS "Kullanıcı bildirimlerini görebilir" ON notifications;
DROP POLICY IF EXISTS "Kullanıcı bildirimini okuyabilir" ON notifications;
DROP POLICY IF EXISTS "Kullanıcı rapor oluşturabilir" ON reports;
DROP POLICY IF EXISTS "Kullanıcı engelleyebilir" ON blocks;
DROP POLICY IF EXISTS "Kullanıcı engellerini görebilir" ON blocks;
DROP POLICY IF EXISTS "Kullanıcı engeli kaldırabilir" ON blocks;
DROP POLICY IF EXISTS "Herkes görselleri görebilir" ON storage.objects;
DROP POLICY IF EXISTS "Giriş yapmış kullanıcılar yükleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Kullanıcılar kendi dosyalarını silebilir" ON storage.objects;

CREATE POLICY "Herkes profilleri görebilir" ON users FOR SELECT USING (true);
CREATE POLICY "Kullanıcı kendi profilini oluşturabilir" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Kullanıcı kendi profilini güncelleyebilir" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Aktif ilanlar herkese açık" ON listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Kullanıcı ilan oluşturabilir" ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Satıcı ilanını güncelleyebilir" ON listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Satıcı ilanını silebilir" ON listings FOR DELETE USING (auth.uid() = seller_id);

CREATE POLICY "Görseller herkese açık" ON listing_images FOR SELECT USING (true);
CREATE POLICY "Satıcı görsel ekleyebilir" ON listing_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
);

CREATE POLICY "Kullanıcı favorilerini görebilir" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcı favori ekleyebilir" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcı favori silebilir" ON favorites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Katılımcılar sohbeti görebilir" ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Kullanıcı sohbet başlatabilir" ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Katılımcılar mesajları görebilir" ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  ));
CREATE POLICY "Katılımcılar mesaj gönderebilir" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "Kullanıcı bildirimlerini görebilir" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcı bildirimini okuyabilir" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcı rapor oluşturabilir" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Kullanıcı engelleyebilir" ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Kullanıcı engellerini görebilir" ON blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Kullanıcı engeli kaldırabilir" ON blocks FOR DELETE USING (auth.uid() = blocker_id);

CREATE POLICY "Herkes görselleri görebilir" ON storage.objects FOR SELECT USING (bucket_id = 'listings');
CREATE POLICY "Giriş yapmış kullanıcılar yükleyebilir" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listings' AND auth.role() = 'authenticated');
CREATE POLICY "Kullanıcılar kendi dosyalarını silebilir" ON storage.objects FOR DELETE
  USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Service role bypass (API server uses service role key)
-- API server connects with service_role which bypasses RLS automatically
