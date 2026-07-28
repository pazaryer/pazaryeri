# Render Supabase Düzeltme

Render Dashboard → **pazaryeri** → **Environment** → mevcut değişkenleri **düzenle** (yeni ekleme).

## Zorunlu

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://vqllsqrgwwzrehcegyot.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → **service_role** (secret) |

> ⚠️ Eski `vqllsqrgwwzrehcgeyot` (hcge) URL'si ve o projeye ait anahtarlar **çalışmaz**.

## Anahtarı nereden alırım?

1. https://supabase.com/dashboard/project/vqllsqrgwwzrehcegyot/settings/api
2. **Project API keys** → `service_role` → Reveal → kopyala
3. Render'da `SUPABASE_SERVICE_ROLE_KEY` değerine yapıştır
4. **Save Changes**

## Test (deploy sonrası ~2 dk)

```
https://pazaryerim.onrender.com/api/listings?limit=1
```

`{"items":[...]}` dönmeli — `Invalid API key` olmamalı.

## Yerel .env

Proje kökündeki `.env` dosyasına aynı iki değeri ekleyin (git'e gitmez).
