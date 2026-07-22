# Pazaryeri - Kurulum Rehberi

Tüm credential'lar `.env` dosyalarına kaydedildi. Aşağıdaki 4 adımı tamamlayın.

---

## Adım 1: Supabase Veritabanı (5 dk)

1. [Supabase Dashboard](https://supabase.com/dashboard/project/vqllsqrgwwzrehcgeyot) açın
2. **SQL Editor** > New Query
3. `supabase/setup.sql` dosyasının tamamını yapıştırıp **Run** basın
4. **Settings > Database** > Connection string (URI) kopyalayın
5. `.env` dosyasında `DATABASE_URL` satırındaki `PAZARYERI_DB_SIFRENIZ` kısmını gerçek şifrenizle değiştirin

### Supabase Auth Ayarları
- **Authentication > Providers > Google**: Firebase/Google Cloud Console'dan Client ID + Secret ekleyin
- **Authentication > URL Configuration > Redirect URLs** ekleyin:
  ```
  pazaryeri://
  exp://127.0.0.1:8081
  https://auth.expo.io/@pazaryeri/pazaryeri
  ```

---

## Adım 2: Cloudflare R2 Bucket (3 dk)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) > R2 > Create bucket
2. Bucket adı: `pazaryeri-listings`
3. **Settings > Public access** > Allow Access > R2.dev subdomain etkinleştirin
4. Public URL'i kopyalayın (örn: `https://pub-xxxxx.r2.dev`)
5. `.env` dosyasında `R2_PUBLIC_URL` değerini güncelleyin

---

## Adım 3: Projeyi Çalıştır

```powershell
cd pazaryeri
pnpm install --ignore-scripts
pnpm --filter @workspace/api-server run build
$env:PORT=5000; pnpm --filter @workspace/api-server run start
```

Yeni terminal:
```powershell
cd pazaryeri\artifacts\mobile
pnpm exec expo start
```

Demo veri yüklemek için (DATABASE_URL ayarlandıktan sonra):
```powershell
pnpm --filter @workspace/scripts run seed
```

---

## Adım 4: Production Deploy

### API (Render.com - ücretsiz)
1. render.com > New Web Service > GitHub repo bağla
2. Build: `pnpm install --ignore-scripts && pnpm --filter @workspace/api-server run build`
3. Start: `node --enable-source-maps artifacts/api-server/dist/index.mjs`
4. Environment variables: `.env` dosyasındaki tüm değerleri ekle
5. `EXPO_PUBLIC_API_URL` = Render URL'iniz

### Mobil (EAS Build)
```powershell
cd artifacts\mobile
$env:EXPO_TOKEN="your-expo-token"
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

### Firebase Hosting (Web landing)
```powershell
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## Ortam Değişkenleri Özeti

| Dosya | İçerik |
|-------|--------|
| `.env` | API server (Supabase, R2, DB) |
| `artifacts/mobile/.env` | Mobil (Supabase, Firebase, API URL) |

---

## Güvenlik Uyarısı

Bu credential'lar sohbette paylaşıldı. Production'a geçmeden önce şunları yenileyin:
- Cloudflare API Token
- Supabase service_role key (rotate)
- R2 Secret Access Key
- Expo token

---

## Destek

Sorun yaşarsanız:
1. API health: `http://localhost:5000/api/healthz`
2. Supabase logs: Dashboard > Logs
3. Expo logs: Terminal çıktısı
