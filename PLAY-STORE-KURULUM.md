# Google Play Store — EAS Build & İmzalama

## Ön koşullar

- Expo hesabı: `pazaryeri`
- `EXPO_TOKEN` ortam değişkeni (Expo dashboard → Access Tokens)
- Google Play Console hesabı

---

## 1. EAS CLI

```powershell
cd artifacts\mobile
$env:EXPO_TOKEN="BURAYA_TOKEN"
pnpm exec eas login
pnpm exec eas whoami
```

---

## 2. Android imzalama (EAS otomatik)

```powershell
$env:EXPO_TOKEN="BURAYA_TOKEN"
pnpm exec eas credentials -p android
```

- **Keystore**: EAS'a yeni keystore oluşturmasını seçin (önerilen)
- SHA-1 fingerprint'i kopyalayın

---

## 3. Firebase Android uygulaması

1. [Firebase Console](https://console.firebase.google.com/project/pazaryeri0/settings/general)
2. **Android uygulaması** (`com.pazaryerim`) → **SHA sertifika parmak izleri**
3. EAS'tan aldığınız **SHA-1** ve **SHA-256** ekleyin
4. Güncel `google-services.json` indirin → `artifacts/mobile/google-services.json` olarak kaydedin

---

## 4. Google Cloud — Android OAuth (Play build için)

[Credentials](https://console.cloud.google.com/apis/credentials?project=hypnotic-maker-503300-e6)

1. **Create Credentials** → **OAuth client ID** → **Android**
2. Package name: `com.pazaryerim`
3. SHA-1: EAS keystore SHA-1
4. Oluşturulan **Android client ID**'yi not alın (ileride native Google Sign-In için)

Mobil giriş şu an **Web client + API OAuth** kullanıyor — Android client şimdilik opsiyonel.

---

## 5. Production build (AAB — Play Store)

```powershell
cd artifacts\mobile
$env:EXPO_TOKEN="BURAYA_TOKEN"
pnpm exec eas build -p android --profile production --non-interactive
```

Build tamamlanınca `.aab` dosyası Expo dashboard'dan indirilir.

---

## 6. Play Console'a yükleme

```powershell
pnpm exec eas submit -p android --profile production --latest
```

Veya Play Console → **Internal testing** → AAB manuel yükle.

---

## 7. Google giriş test (production build)

1. Render'da `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` doğru
2. Firebase safelist'te `637257...` client ID
3. Internal test track'ten APK/AAB yükleyip gerçek cihazda test edin

---

## Sorun giderme

| Sorun | Çözüm |
|-------|-------|
| `redirect_uri_mismatch` | Google Cloud redirect URI listesini kontrol edin |
| `auth/invalid-credential` | Firebase safelist'e 637257 client ID ekleyin |
| `client_secret is missing` | Render'a `GOOGLE_CLIENT_SECRET` ekleyin |
| Play imza hatası | EAS credentials yeniden oluşturun, SHA-1 Firebase'e ekleyin |
