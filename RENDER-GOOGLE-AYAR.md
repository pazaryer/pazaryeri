# Render — Google Giriş Ayarı (Expo Go)

Deploy başarılı ama Google giriş çalışmıyorsa **%99 sebep: GOOGLE_CLIENT_SECRET eksik**.

Test: https://pazaryerim.onrender.com/api/auth/google/mobile?app_redirect=pazaryeri://auth

Şu hatayı görüyorsanız secret eksik:
```json
{"error":"Google OAuth yapılandırılmamış..."}
```

---

## Adım 1 — Client Secret al

1. [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials?project=pazaryeri0)
2. **OAuth 2.0 Client IDs** → **Web client** (Firebase tarafından oluşturulmuş)
3. **Client secret** değerini kopyala

Alternatif: [Firebase → Authentication → Google](https://console.firebase.google.com/project/pazaryeri0/authentication/providers) → Web SDK configuration → secret

---

## Adım 2 — Render Environment Variables

[Render Dashboard](https://dashboard.render.com) → **pazaryerim** → **Environment**:

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_ID` | `637257074433-gr8vbeupacshsv6omfsf60mn5rkef719.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud'dan kopyaladığın secret |
| `API_PUBLIC_URL` | `https://pazaryerim.onrender.com` |
| `FIREBASE_PROJECT_ID` | `pazaryeri0` |

**Save Changes** → **Manual Deploy**

---

## Adım 3 — Google Cloud Redirect URI

Aynı Web client'ta **Authorized redirect URIs** ekle:

```
https://pazaryerim.onrender.com/api/auth/google/callback
```

**Authorized JavaScript origins** (web için):
```
https://pazaryeri0.web.app
https://pazaryerim.onrender.com
```

---

## Adım 4 — Test

Deploy bitince tarayıcıda aç:
https://pazaryerim.onrender.com/api/auth/google/mobile?app_redirect=pazaryeri://auth

→ Google hesap seçme sayfası açılmalı (JSON hata değil)

---

## Adım 5 — Expo Go

```powershell
cd artifacts\mobile
pnpm exec expo start --clear
```

Google ile Giriş Yap → Google hesabı seç → uygulamaya dönmeli.

---

## Loglardaki diğer mesajlar

| Log | Anlam |
|-----|-------|
| `GET /` → 404 | Eski deploy; yeni deploy'da `/` JSON döner |
| `GET /api/conversations` → 500 | Düzeltildi; yeni deploy gerekli |
| `Free instance spin down` | Normal; ilk istek 30-50 sn sürebilir |
