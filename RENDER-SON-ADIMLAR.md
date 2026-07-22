# Render Deploy — Son Adımlar

## 1. GitHub'a Push (Render için zorunlu)

PowerShell'de proje klasöründe:

```powershell
cd C:\Users\hasan\OneDrive\Masaüstü\pazaryeri
git push -u origin main
```

İlk kez push ediyorsan GitHub kullanıcı adı + Personal Access Token isteyecek.

---

## 2. Render Environment Variables

**ÖNEMLİ:** "duplicate key" hatası aldıysan sayfayı yenile (F5). Yeni ekleme — mevcut satırların **Value** alanını düzenle.

Placeholder metinleri (`service role key`, `Cloudflare R2 key` vb.) silip **gerçek değerleri** yapıştır.

| Key | Gerçek değer nerede? |
|-----|----------------------|
| `SUPABASE_URL` | `.env` dosyası |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` dosyası (eyJhbGci... ile başlayan uzun key) |
| `FIREBASE_PROJECT_ID` | `pazaryeri0` |
| `R2_ACCESS_KEY_ID` | `.env` dosyası |
| `R2_SECRET_ACCESS_KEY` | `.env` dosyası |
| `R2_ENDPOINT` | `.env` dosyası |
| `R2_BUCKET_NAME` | `pazaryeri-listings` |
| `R2_PUBLIC_URL` | `.env` dosyası |
| `CLOUDFLARE_ACCOUNT_ID` | `.env` dosyası |
| `NODE_ENV` | `production` |

`FIREBASE_SERVICE_ACCOUNT_JSON` **artık gerekli değil** — silebilirsin.

Değerleri görmek için (terminalde):
```powershell
.\RENDER-ENV-KOPYALA.ps1
```

---

## 3. Render Build Ayarları

| Alan | Değer |
|------|-------|
| Runtime | **Node** |
| Build | `npm install -g pnpm@9 && pnpm install --ignore-scripts && pnpm --filter @workspace/api-server run build` |
| Start | `node --enable-source-maps artifacts/api-server/dist/index.mjs` |
| Health Check | `/api/healthz` |

---

## 4. Deploy Sonrası Test

```
https://pazaryerim.onrender.com/api/healthz
```

Beklenen: `{"status":"ok"}`

---

## 5. Firebase Console (bir kez)

1. **Authentication → Sign-in method** → Email/Password ✅ + Google ✅
2. Google Web Client ID zaten mobil `.env`'e eklendi

---

## 6. Uygulamayı Başlat

```powershell
.\BASLAT.ps1
```

Veya:
```powershell
cd artifacts\mobile
pnpm exec expo start
```
