# Google OAuth Kurulumu (5 dk)

## 1. Firebase'den Client Secret al

1. [Firebase Console](https://console.firebase.google.com/project/pazaryeri0/authentication/providers)
2. **Authentication → Sign-in method → Google** → Açık olmalı
3. **Web client secret** değerini kopyala

## 2. Render Environment Variables

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_ID` | `445495602976-7sqmtkk198ucafhpgsc0girnbvuujh20.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Firebase'den kopyaladığın secret |
| `API_PUBLIC_URL` | `https://pazaryerim.onrender.com` |

**Save → Manual Deploy**

## 3. Google Cloud Console — Redirect URI

1. [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials?project=pazaryeri0)
2. **Web client** (445495602976-...) → Düzenle
3. **Authorized redirect URIs** ekle:

```
https://pazaryerim.onrender.com/api/auth/google/callback
```

4. Kaydet

## 4. OAuth Consent Screen

[OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent?project=pazaryeri0)

- Uygulama **Testing** modundaysa → **Test users** listesine kendi Gmail adresini ekle
- Aksi halde "Erişim engellendi" hatası alırsın

## 5. Test

Expo'yu yeniden başlat (`expo start --clear`) → Google ile Giriş Yap
