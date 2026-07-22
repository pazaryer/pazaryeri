# Render Deploy — Adım Adım

## ⚠️ ÖNEMLİ: Supabase SQL Editor ≠ Terminal

SQL Editor'e **sadece SQL** yapıştırılır. Şunlar SQL değil, terminal komutlarıdır — SQL Editor'de ÇALIŞMAZ:

```
supabase login      ❌ YANLIŞ
supabase init       ❌ YANLIŞ
supabase link       ❌ YANLIŞ
```

SQL Editor'e yapıştırman gereken: `supabase/setup.sql` dosyasının **tamamı** (CREATE TABLE ile başlar).

---

## 1. Supabase — SQL Editor (2 dk)

1. Aç: https://supabase.com/dashboard/project/vqllsqrgwwzrehcgeyot/sql/new
2. Proje klasöründeki `supabase/setup.sql` dosyasını aç
3. **Tüm içeriği** kopyala (230+ satır, `-- Pazaryeri` ile başlar)
4. SQL Editor'e yapıştır → **Run** (Ctrl+Enter)
5. "Success" veya "already exists" mesajları görürsen tamam

---

## 2. Render — Ayarları Düzelt

Render'da şu an **Rust** seçilmiş — bu yanlış. Node.js olmalı.

### Settings sekmesinde şunları değiştir:

| Alan | Değer |
|------|-------|
| **Language** | `Node` (Rust değil!) |
| **Branch** | `main` |
| **Root Directory** | *(boş bırak)* |
| **Build Command** | `corepack enable && pnpm install --ignore-scripts && pnpm run render-build` |
| **Start Command** | `node --enable-source-maps artifacts/api-server/dist/index.mjs` |
| **Health Check Path** | `/api/healthz` |

### Environment Variables (Settings → Environment):

Aşağıdakileri tek tek ekle (`.env` dosyandan kopyala):

```
SUPABASE_URL=https://vqllsqrgwwzrehcgeyot.supabase.co
SUPABASE_SERVICE_ROLE_KEY=(service_role key)
R2_ACCESS_KEY_ID=(cloudflare r2 key)
R2_SECRET_ACCESS_KEY=(cloudflare r2 secret)
R2_ENDPOINT=https://0e91f6e2958cfd7a0ce126a42150c486.r2.cloudflarestorage.com
R2_BUCKET_NAME=pazaryeri-listings
R2_PUBLIC_URL=(r2 public url)
CLOUDFLARE_ACCOUNT_ID=0e91f6e2958cfd7a0ce126a42150c486
NODE_ENV=production
```

`PORT` ekleme — Render otomatik atar.

### Deploy

**Manual Deploy** → **Deploy latest commit** bas.

Deploy bitince test et:
```
https://pazaryeri.onrender.com/api/healthz
```
Cevap: `{"status":"ok"}`

---

## 3. Mobil Uygulama — Production API URL

`artifacts/mobile/.env` dosyasında:

```
EXPO_PUBLIC_API_URL=https://pazaryeri.onrender.com
```

Sonra Expo'yu yeniden başlat.

---

## 4. Supabase Auth Redirect URLs

Authentication → URL Configuration → Redirect URLs:

```
pazaryeri://
https://pazaryeri.onrender.com
exp://127.0.0.1:8081
```

---

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| SQL syntax error "supabase" | CLI komutu SQL Editor'e yapıştırılmış — setup.sql kullan |
| Render build fail | Language = Node olduğundan emin ol |
| API 502 | Environment variables eksik olabilir |
| İlanlar boş | setup.sql henüz çalıştırılmamış |
| Free tier uyku | İlk istek 30-60 sn sürebilir |
