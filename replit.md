# Pazaryeri

Türkiye'nin premium ikinci el alım-satım mobil uygulaması.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API sunucusu (port 5000)
- `pnpm --filter @workspace/mobile run dev` — Expo mobil uygulama
- `pnpm run typecheck` — tüm paketlerde tip kontrolü
- `pnpm --filter @workspace/db run push` — DB şemasını Supabase'e push et
- `pnpm --filter @workspace/scripts run seed` — demo verileri yükle

## Stack

- **Mobil:** React Native 0.81, Expo 54, Expo Router 6
- **API:** Express 5, Drizzle ORM, PostgreSQL (Supabase)
- **Auth:** Supabase Auth (Google + Telefon OTP)
- **Storage:** Supabase Storage (ilan fotoğrafları)
- **Push:** Expo Push Notifications (ücretsiz)
- **Realtime:** Supabase Realtime (mesajlar)

## Ortam Değişkenleri

`.env.example` dosyasına bakın. Gerekli:
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — API sunucusu için
- `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` — mobil için
- `EXPO_PUBLIC_API_URL` — API sunucusu URL'i

## Kurulum

1. Supabase projesi oluştur
2. `supabase/setup.sql` dosyasını SQL Editor'de çalıştır
3. `.env` dosyalarını doldur
4. `pnpm --filter @workspace/db run push`
5. `pnpm --filter @workspace/scripts run seed` (opsiyonel demo veri)
6. API ve mobil uygulamayı başlat

## Özellikler

- Google + Telefon OTP ile giriş
- İlan oluşturma (fotoğraf yükleme, konum, kategori)
- Masonry grid ana sayfa + kategori filtresi
- Arama ve keşfet (bento grid kategoriler)
- İlan detay, favoriler, paylaşım, şikayet
- Gerçek zamanlı mesajlaşma
- Push bildirimler
- Kullanıcı profili ve ilanlarım
- KVKK / Gizlilik Politikası ekranları
