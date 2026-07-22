# ⚡ KOPYALA YAPIŞTIR REHBERİ

## ❌ SQL EDITOR'E BUNLARI YAPIŞTIRMA:
- Render sayfasındaki yazılar ("Outbound IP Addresses" vb.)
- Terminal komutları (`supabase login`, `yarn` vb.)
- Bu rehberin kendisi

## ✅ SQL EDITOR'E SADECE BUNU YAPIŞTIR:

1. Bilgisayarında şu dosyayı aç: **`supabase/setup.sql`**
2. **Ctrl+A** (hepsini seç) → **Ctrl+C** (kopyala)
3. Supabase SQL Editor'e git: https://supabase.com/dashboard/project/vqllsqrgwwzrehcgeyot/sql/new
4. Editörü **tamamen temizle** (eski her şeyi sil)
5. **Ctrl+V** yapıştır
6. **Run** bas

İlk satır şöyle görünmeli:
```
-- Pazaryeri - Tam Veritabanı Kurulumu
```

---

## 🚀 RENDER AYARLARI (pazaryerim servisi)

Render Dashboard → **pazaryerim** → **Settings**

### Build & Deploy

| Alan | Kopyala yapıştır |
|------|------------------|
| **Language** | Node |
| **Build Command** | `npm run render-build:ci` |
| **Start Command** | `node --enable-source-maps artifacts/api-server/dist/index.mjs` |
| **Health Check Path** | `/api/healthz` |

> `yarn` ve `yarn start` KULLANMA — çalışmaz.

### Environment Variables (tek tek ekle)

| KEY | VALUE |
|-----|-------|
| `SUPABASE_URL` | `https://vqllsqrgwwzrehcgeyot.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *( .env dosyandan kopyala )* |
| `R2_ACCESS_KEY_ID` | *( .env dosyandan kopyala )* |
| `R2_SECRET_ACCESS_KEY` | *( .env dosyandan kopyala )* |
| `R2_ENDPOINT` | `https://0e91f6e2958cfd7a0ce126a42150c486.r2.cloudflarestorage.com` |
| `R2_BUCKET_NAME` | `pazaryeri-listings` |
| `R2_PUBLIC_URL` | *( cloudflare r2 public url )* |
| `CLOUDFLARE_ACCOUNT_ID` | `0e91f6e2958cfd7a0ce126a42150c486` |
| `NODE_ENV` | `production` |

**PORT ekleme** — Render otomatik verir.

### Deploy
**Manual Deploy** → **Deploy latest commit**

### Test
Tarayıcıda aç: **https://pazaryerim.onrender.com/api/healthz**

Görmek istediğin: `{"status":"ok"}`

---

## 📱 Mobil uygulama

`.env` dosyasında API URL güncellendi:
```
EXPO_PUBLIC_API_URL=https://pazaryerim.onrender.com
```

Expo'yu yeniden başlat:
```powershell
cd artifacts\mobile
pnpm exec expo start
```
