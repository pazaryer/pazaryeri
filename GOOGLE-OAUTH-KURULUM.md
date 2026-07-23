# Google Giriş

## Client ID (hepsi bu)

```
637257074433-gr8vbeupacshsv6omfsf60mn5rkef719.apps.googleusercontent.com
```

Firebase → Authentication → Google → **Safelist client IDs** → bu ID ekli olmalı.

---

## Mobil (Expo Go) — doğrudan hesap seçici

Web sitesi açılmaz. `accounts.google.com` hesap seçici açılır.

Google Console → Web client `637257...`:

**Authorized JavaScript origins** (web girişi için zorunlu):

```
https://pazaryeri0.web.app
https://pazaryeri0.firebaseapp.com
http://localhost:8081
```

**Authorized redirect URIs** (mobil Expo Go):

```
https://auth.expo.io/@pazaryeri/pazaryeri
```

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
