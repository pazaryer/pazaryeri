-- Pazaryeri v4: İlan iletişim telefonu
ALTER TABLE listings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
