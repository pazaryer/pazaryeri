# Google Giriş

## Client ID (hepsi bu)

```
637257074433-gr8vbeupacshsv6omfsf60mn5rkef719.apps.googleusercontent.com
```

Firebase → Authentication → Google → **Safelist client IDs** → bu ID ekli olmalı.

---

**Authorized JavaScript origins** (web girişi):

```
https://pazaryeri0.web.app
https://pazaryeri0.firebaseapp.com
```

## Mobil (Expo Go) — API OAuth (auth.expo.io YOK)

Hesap seçici → Google → Render API → uygulamaya `id_token` döner.

Google Console → Web client `637257...` → **Authorized redirect URIs**:

```
https://pazaryerim.onrender.com/api/auth/google/callback
```

`auth.expo.io` artık gerekmez (sık hata verir).

**Test users** (OAuth consent screen): Gmail adresinizi ekleyin.

```powershell
cd artifacts/mobile
pnpm exec expo start --clear
```

---

## Web girişi

`/giris` → Google Identity Services butonu (`637257` client). Firebase popup kullanılmaz.

---

## Deploy

```powershell
pnpm run web:build
pnpm run web:deploy
```
