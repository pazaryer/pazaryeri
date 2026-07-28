# ACİL — Render Google OAuth Düzeltme (redirect_uri_mismatch)

## Sorunun nedeni

Canlı API hâlâ **yanlış client ID** kullanıyor:

| | Canlı (bozuk) | Olması gereken |
|---|---------------|----------------|
| Client ID | `445495602976-...` (Firebase) | `637257074433-...` (Google Cloud Web client 1) |
| Redirect URI | `https://pazaryerim.onrender.com/api/auth/google/callback` | Aynı — ama **637257 client'ta** kayıtlı olmalı |

`redirect_uri_mismatch` = Google'a gönderilen `client_id` ile `redirect_uri` eşleşmiyor.

---

## 3 adımda düzelt (5 dakika)

### 1. Render Environment Variables

[Render Dashboard](https://dashboard.render.com) → **pazaryerim** → **Environment**

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_ID` | `637257074433-gr8vbeupacshsv6omfsf60mn5rkef719.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud → Web client 1 → Client secret |

**SİL veya güncelle:**
- `GOOGLE_WEB_CLIENT_ID` varsa ve `445495...` içeriyorsa → **sil** veya `637257...` yap

**Save Changes** tıkla.

### 2. Manual Deploy

Aynı sayfada **Manual Deploy** → **Deploy latest commit**

GitHub bağlı değilse: repo'ya push et veya Render'da GitHub'ı yeniden bağla.

### 3. Doğrula

Tarayıcıda aç:
```
https://pazaryerim.onrender.com/api/auth/google/start?return=pazaryeri://auth
```

Google sayfasında URL'de şunu görmelisin:
```
client_id=637257074433-gr8vbeupacshsv6omfsf60mn5rkef719
```

**NOT:** `445495602976` görürsen deploy henüz tamamlanmamış veya env yanlış.

---

## Firebase (web giriş için zorunlu)

1. [Firebase → Authentication → Google](https://console.firebase.google.com/project/pazaryeri0/authentication/providers)
2. **Safelist client IDs** → ekle:
   ```
   637257074433-gr8vbeupacshsv6omfsf60mn5rkef719.apps.googleusercontent.com
   ```

---

## Web sitesi

Web güncellendi: https://pazaryeri0.web.app/giris  
Google'ın resmi butonu kullanılıyor (redirect_uri gerektirmez).

Test: Ctrl+Shift+R ile hard refresh yap.
