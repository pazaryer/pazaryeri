# Google Giriş — Google Cloud Web client 1 (637257...)

## Client ID (tüm platformlar)

```
637257074433-gr8vbeupacshsv6omfsf60mn5rkef719.apps.googleusercontent.com
```

Google Cloud projesi: **My Project 50208**

---

## 1. Google Cloud Console (ekran görüntünüzdeki gibi)

[Credentials](https://console.cloud.google.com/apis/credentials?project=hypnotic-maker-503300-e6)

**Web client 1** → şunlar kayıtlı olmalı:

### Authorized JavaScript origins
```
https://pazaryeri0.web.app
https://pazaryeri0.firebaseapp.com
```

### Authorized redirect URIs
```
https://pazaryerim.onrender.com/api/auth/google/callback
https://pazaryeri0.web.app
https://pazaryeri0.firebaseapp.com
https://pazaryeri0.web.app/oauth/mobile
```

> `__/auth/handler` adresini tarayıcıda **doğrudan açmayın** — bu Firebase iç adresidir, boş açılınca "missing initial state" hatası normaldir. Mobil giriş API OAuth kullanır, bu URI gerekmez.

> `auth.expo.io` artık kullanılmıyor — silebilirsiniz.

---

## 2. Render API (mobil giriş için zorunlu)

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_ID` | `637257074433-gr8vbeupacshsv6omfsf60mn5rkef719.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud → Web client 1 → Client secret |

**Manual Deploy** yapın.

Kontrol: https://pazaryerim.onrender.com/api/healthz (google alanına bakın)

---

## 3. Firebase (pazaryeri0) — zorunlu

1. [Authentication → Google](https://console.firebase.google.com/project/pazaryeri0/authentication/providers) → **Enable**
2. **Safelist client IDs** → şunu ekleyin:
   ```
   637257074433-gr8vbeupacshsv6omfsf60mn5rkef719.apps.googleusercontent.com
   ```
3. **Authorized domains**: `pazaryeri0.web.app`, `pazaryeri0.firebaseapp.com`

---

## 4. Uygulama akışları

| Platform | Akış |
|----------|------|
| **Web** | `/giris` → Google Identity Services (637257 client) → Firebase |
| **Mobil** | API OAuth → `accounts.google.com` → Render callback → uygulama |

---

## 5. Test

```powershell
cd artifacts\mobile
pnpm exec expo start --clear
```

Tarayıcı: https://pazaryeri0.web.app/giris

Mobil API test:
```
https://pazaryerim.onrender.com/api/auth/google/start?return=pazaryeri://auth
```

---

## 6. Deploy

```powershell
pnpm run web:build
pnpm run web:deploy
```

GitHub push → Render otomatik deploy.

Play Store build: `PLAY-STORE-KURULUM.md`
