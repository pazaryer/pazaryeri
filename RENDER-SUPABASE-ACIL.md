# İlan verme hatası: fetch failed (HTTP 500) — ACİL DÜZELTME

## Sorun
Render'daki `SUPABASE_URL` **yanlış proje ID** kullanıyor.

| | Değer |
|---|---|
| ❌ Yanlış (DNS çözülmüyor) | `https://vqllsqrgwwzrehcgeyot.supabase.co` |
| ✅ Doğru | `https://vqllsqrgwwzrehcegyot.supabase.co` |

Fark: `hcge` değil **`ceg`** — harf sırası karışmış.

## Render'da yapılacaklar (2 dakika)

1. Aç: https://dashboard.render.com → **pazaryeri** servisi → **Environment**
2. `SUPABASE_URL` değerini şununla değiştir:
   ```
   https://vqllsqrgwwzrehcegyot.supabase.co
   ```
3. `SUPABASE_SERVICE_ROLE_KEY` — doğru projeden alın:
   - https://supabase.com/dashboard/project/vqllsqrgwwzrehcegyot/settings/api
   - **service_role** (secret) anahtarını kopyala → Render'a yapıştır
   - ⚠️ `Invalid API key` hatası = bu anahtar yanlış veya eski projeden kalmış
4. **Save Changes** → servis yeniden başlar (~1-2 dk)

## Test

Tarayıcıda veya terminalde:
```
https://pazaryerim.onrender.com/api/listings?limit=1
```
`{"items":[...]}` dönmeli, `fetch failed` olmamalı.

Sonra https://pazaryeri0.web.app/ilan-ver sayfasından ilan vermeyi dene.
