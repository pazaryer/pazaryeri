# Supabase Secret Key — Adım Adım (Türkçe)

> Supabase artık `service_role` yerine **`sb_secret_...`** anahtarı kullanıyor.  
> İkisi de Render'da `SUPABASE_SERVICE_ROLE_KEY` alanına yapıştırılır.

---

## Yöntem 1 — Doğrudan link (en kolay)

1. Bu sayfayı açın:  
   **https://supabase.com/dashboard/project/vqllsqrgwwzrehcegyot/settings/api-keys**

2. Üstte iki sekme görürsünüz:
   - **Publishable and secret API keys** (yeni)
   - **Legacy API Keys** (eski)

### Sekme A: "Publishable and secret API keys"
- **Secret keys** bölümüne inin
- `default` veya benzeri bir satırda **Reveal** / **Göster** tıklayın
- `sb_secret_...` ile başlayan anahtarı kopyalayın

> Secret key yoksa **Create new API keys** butonuna tıklayın — otomatik oluşturulur.

### Sekme B: "Legacy API Keys"
- **service_role** satırında **Reveal** tıklayın
- `eyJhbGci...` ile başlayan uzun anahtarı kopyalayın

---

## Yöntem 2 — Connect penceresi

1. Açın: **https://supabase.com/dashboard/project/vqllsqrgwwzrehcegyot?showConnect=true**
2. **App Framework** veya **API Keys** sekmesine geçin
3. **Secret key** (`sb_secret_...`) değerini kopyalayın

---

## Render'a yapıştırma

1. https://dashboard.render.com → **pazaryeri** servisi
2. **Environment**
3. Düzenle:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://vqllsqrgwwzrehcegyot.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Kopyaladığınız `sb_secret_...` veya `eyJhbGci...` |

4. **Save Changes**

---

## Test

```
https://pazaryerim.onrender.com/api/listings?limit=1
```

`{"items":...}` görürseniz tamamdır.

---

## Bana anahtarı buraya yapıştırmayın

Güvenlik için anahtarı sohbete yazmayın. Sadece Render Environment'a yapıştırın.  
Yapıştırdıktan sonra "test ettim" yazın, ben kontrol ederim.
