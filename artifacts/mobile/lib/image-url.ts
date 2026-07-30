/** Grid / liste küçük resimleri (~3 sütun) */
const THUMB_PX = 128;
/** Mesaj / avatar küçük resimleri */
const SMALL_PX = 96;
/** Orta boy (detay önizleme) */
const MEDIUM_PX = 640;
/** Kategori şeridi */
const CATEGORY_PX = 120;

function appendQuery(url: string, params: Record<string, string>): string {
  try {
    const u = new URL(url);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return u.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    const q = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    return `${url}${sep}${q}`;
  }
}

/** CDN resize yoksa hafif proxy (ImgBB vb.) */
function proxyResize(url: string, w: number, h = w): string {
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&h=${h}&fit=cover&output=webp&q=72`;
}

function unsplashSize(url: string, px: number): string {
  if (!url.includes('images.unsplash.com')) return url;
  return appendQuery(url, { w: String(px), h: String(px), fit: 'crop', q: '70', auto: 'format' });
}

function supabaseSize(url: string, px: number): string {
  if (!url.includes('supabase.co') || !url.includes('/storage/v1/object/public/')) return url;
  const renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  return appendQuery(renderUrl, {
    width: String(px),
    height: String(px),
    resize: 'cover',
  });
}

function imgbbOrCdnSize(url: string, px: number): string {
  if (url.includes('i.ibb.co') || url.includes('ibb.co/')) return proxyResize(url, px);
  if (url.includes('imgbb.com')) return proxyResize(url, px);
  return url;
}

function resizeImageUrl(url: string, px: number): string {
  if (url.includes('images.unsplash.com')) return unsplashSize(url, px);
  if (url.includes('supabase.co')) return supabaseSize(url, px);
  if (url.includes('firebasestorage.googleapis.com')) {
    return appendQuery(url, { w: String(px) });
  }
  return imgbbOrCdnSize(url, px);
}

/** İlan grid / kart küçük resmi */
export function listingThumbUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  return resizeImageUrl(url.trim(), THUMB_PX);
}

/** Mesaj / profil yatay kart küçük resmi */
export function listingSmallUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  return resizeImageUrl(url.trim(), SMALL_PX);
}

/** Detay sayfası orta boy */
export function listingMediumUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  return resizeImageUrl(url.trim(), MEDIUM_PX);
}

/** Kategori şeridi */
export function categoryImageUrl(url: string): string {
  return resizeImageUrl(url, CATEGORY_PX);
}

/** Avatar */
export function avatarUrl(url: string | null | undefined, size = 48, name = 'U'): string {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3D1A78&color=fff&size=${size * 2}`;
  if (!url?.startsWith('http')) return fallback;
  if (url.includes('ui-avatars.com')) return url;
  return resizeImageUrl(url, size * 2);
}
