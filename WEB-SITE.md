# Web Sitesi — https://pazaryeri0.web.app

Pazaryeri web arayüzü Firebase Hosting üzerinde yayınlanır.

## Hızlı Deploy

```powershell
cd pazaryeri
pnpm run web:build
firebase login
pnpm run web:deploy
```

Veya: **`WEB-DEPLOY.bat`** çift tıkla

## Ortam Değişkenleri (mobil `.env`)

```
EXPO_PUBLIC_SITE_URL=https://pazaryeri0.web.app
EXPO_PUBLIC_API_URL=https://pazaryerim.onrender.com
```

## Firebase Auth — Authorized Domains

[Firebase Console → Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/pazaryeri0/authentication/settings)

Şunlar listede olmalı:
- `pazaryeri0.web.app`
- `pazaryeri0.firebaseapp.com`
- `localhost` (geliştirme)

## Google OAuth

Web client redirect URI (Google Cloud Console):
```
https://pazaryeri0.web.app
https://pazaryeri0.firebaseapp.com/__/auth/handler
https://pazaryerim.onrender.com/api/auth/google/callback
```

## Paylaşım Linkleri

İlan paylaşım URL'leri otomatik olarak şu formatta:
```
https://pazaryeri0.web.app/listing/{id}
```
