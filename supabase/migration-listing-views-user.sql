-- İlan görüntüleyen kullanıcıyı kaydet (sahip analitiği için)
ALTER TABLE listing_views ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS listing_views_user_idx ON listing_views(user_id);
