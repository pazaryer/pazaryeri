# Web Sitesi Kurulumu — pazaryeri0.web.app

## Sorun: Site bos / 404

Site henuz Firebase'e yuklenmemis. **WEB-DEPLOY basarisiz** cunku Firebase girisi yapilmamis.

---

## Yontem A — Bilgisayardan deploy (onerilen)

### Adim 1: Firebase giris
```
FIREBASE-GIRIS.bat
```
Tarayicida Google hesabinizla giris yapin.

### Adim 2: Siteyi yayinla
```
WEB-DEPLOY.bat
```

Basarili olunca: **https://pazaryeri0.web.app**

---

## Yontem B — GitHub uzerinden otomatik deploy

1. [Firebase Console](https://console.firebase.google.com/project/pazaryeri0/settings/serviceaccounts/adminsdk) → **Generate new private key** → JSON indir
2. GitHub repo → **Settings → Secrets → Actions** → `FIREBASE_SERVICE_ACCOUNT` olarak JSON icerigini ekle
3. Kodu `main` branch'e push et → otomatik deploy

---

## Auth calismasi icin (Firebase Console)

1. [Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/pazaryeri0/authentication/settings)
   - `pazaryeri0.web.app` ekli olmali
   - `localhost` ekli olmali

2. [Sign-in method → Google](https://console.firebase.google.com/project/pazaryeri0/authentication/providers) → **Enabled**

3. [Sign-in method → Email/Password](https://console.firebase.google.com/project/pazaryeri0/authentication/providers) → **Enabled**

4. OAuth Testing modundaysa: [Google Cloud Consent](https://console.cloud.google.com/apis/credentials/consent?project=pazaryeri0) → Test users → kendi Gmail'inizi ekleyin

---

## Test

| Ozellik | URL |
|---------|-----|
| Web giris | https://pazaryeri0.web.app/login |
| Google OAuth koprusu | https://pazaryeri0.web.app/oauth/google |
| API saglik | https://pazaryerim.onrender.com/api/healthz |
