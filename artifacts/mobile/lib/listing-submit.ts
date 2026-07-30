export function parseListingPrice(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const value = parseInt(digits, 10);
  return Number.isFinite(value) ? value : null;
}

export function sanitizeListingImages(images: string[]): string[] {
  return images
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => (url.startsWith('//') ? `https:${url}` : url))
    .filter((url) => /^https?:\/\//i.test(url));
}

export function validateListingForm(input: {
  title: string;
  price: string;
  category: string;
  phone: string;
  images: string[];
}): { ok: true; images: string[]; price: number } | { ok: false; message: string } {
  const title = input.title.trim();
  if (title.length < 3) {
    return { ok: false, message: 'Başlık en az 3 karakter olmalı' };
  }

  const price = parseListingPrice(input.price);
  if (price == null) {
    return { ok: false, message: 'Geçerli bir fiyat girin (ör. 1500)' };
  }

  if (!input.category) {
    return { ok: false, message: 'Kategori seçin' };
  }

  if (!input.phone.trim()) {
    return { ok: false, message: 'İletişim telefonu gerekli' };
  }

  const images = sanitizeListingImages(input.images);
  if (images.length === 0) {
    return {
      ok: false,
      message: 'En az 1 fotoğraf gerekli. Fotoğrafları yeniden ekleyip tekrar deneyin.',
    };
  }

  return { ok: true, images, price };
}

export function hasValidCoords(latitude?: number, longitude?: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude);
}
