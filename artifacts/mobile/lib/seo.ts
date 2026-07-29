import { SITE_URL, sitePath } from '@/lib/config';
import { LISTING_CATEGORIES, WEB_CATEGORIES } from '@/lib/categories';

export const SEO_BRAND = 'Pazaryeri';
export const SEO_TAGLINE = "Türkiye'nin ikinci el alım satım platformu";

export const SEO_KEYWORDS = [
  'pazaryeri',
  'ikinci el',
  'ikinci el alım satım',
  'alım satım',
  'ücretsiz ilan',
  'ücretsiz ilan ver',
  'ikinci el ilan',
  'sahibinden',
  'letgo alternatif',
  'ikinci el telefon',
  'ikinci el araba',
  'ikinci el mobilya',
  'ikinci el elektronik',
  'güvenli alışveriş',
  'türkiye pazaryeri',
  'online pazaryeri',
  'ilan sitesi',
  'satılık',
  'ikinci el eşya',
  'komisyonsuz ilan',
].join(', ');

export const DEFAULT_SEO = {
  title: 'Pazaryeri — İkinci El Alım Satım | Ücretsiz İlan Ver',
  description:
    "Pazaryeri ile ücretsiz ilan verin, ikinci el alım satım yapın. Telefon, araç, mobilya, elektronik ve binlerce kategoride güvenli ikinci el alışveriş. Türkiye'nin modern pazaryeri uygulaması.",
  path: '/',
} as const;

export const SEO_FAQ = [
  {
    question: 'Pazaryeri nedir?',
    answer:
      'Pazaryeri, Türkiye genelinde ikinci el alım satım yapabileceğiniz ücretsiz bir ilan platformudur. Telefon, araç, mobilya, elektronik ve daha fazlasını güvenle alıp satabilirsiniz.',
  },
  {
    question: 'Pazaryeri\'de ilan vermek ücretli mi?',
    answer:
      'Hayır. Pazaryeri\'de ilan vermek tamamen ücretsizdir. Komisyon alınmaz; alıcı ve satıcı doğrudan mesajlaşır.',
  },
  {
    question: 'Hangi kategorilerde ilan verebilirim?',
    answer:
      'Elektronik, telefon, bilgisayar, araç, emlak, mobilya, moda, spor, bebek, hobi ve daha birçok kategoride ikinci el ilan oluşturabilirsiniz.',
  },
  {
    question: 'Pazaryeri güvenli mi?',
    answer:
      'Pazaryeri güvenli mesajlaşma, profil doğrulama ve şikayet sistemi sunar. Ödeme ve teslimatı yüz yüze yapmanızı öneririz.',
  },
  {
    question: 'Mobil uygulama var mı?',
    answer:
      'Evet. Pazaryeri iOS ve Android uygulaması ile ilan verebilir, mesajlaşabilir ve bildirim alabilirsiniz. Web sitesinden de tüm işlemleri yapabilirsiniz.',
  },
] as const;

export const SEO_POPULAR_SEARCHES = [
  { label: 'İkinci el telefon', query: 'ikinci el telefon' },
  { label: 'İkinci el araba', query: 'ikinci el araba' },
  { label: 'İkinci el mobilya', query: 'ikinci el mobilya' },
  { label: 'İkinci el laptop', query: 'ikinci el laptop' },
  { label: 'Ücretsiz ilan ver', query: 'ücretsiz ilan' },
  { label: 'Alım satım', query: 'alım satım' },
  { label: 'İkinci el eşya', query: 'ikinci el eşya' },
  { label: 'Pazaryeri ilanları', query: 'pazaryeri' },
] as const;

export function seoTitle(pageTitle?: string): string {
  if (!pageTitle) return DEFAULT_SEO.title;
  if (pageTitle.includes(SEO_BRAND)) return pageTitle;
  return `${pageTitle} | ${SEO_BRAND}`;
}

export function seoDescription(custom?: string): string {
  return custom ?? DEFAULT_SEO.description;
}

export function canonicalUrl(path = '/'): string {
  return sitePath(path);
}

export function ogImageUrl(image?: string | null): string {
  return image?.startsWith('http') ? image : sitePath('/og-image.png');
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_BRAND,
    url: SITE_URL,
    logo: sitePath('/og-image.png'),
    description: DEFAULT_SEO.description,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['Turkish', 'tr'],
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_BRAND,
    alternateName: ['Pazaryeri İkinci El', 'Pazaryeri Alım Satım'],
    url: SITE_URL,
    description: DEFAULT_SEO.description,
    inLanguage: 'tr-TR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/kesfet?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SEO_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: sitePath(item.path),
    })),
  };
}

export function buildProductJsonLd(listing: {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  images?: string[];
  city?: string | null;
  status?: string;
  createdAt?: string;
}) {
  const images = (listing.images?.length ? listing.images : listing.image ? [listing.image] : []).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description?.slice(0, 500) || listing.title,
    image: images.length ? images : [ogImageUrl()],
    url: sitePath(`/listing/${listing.id}`),
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'TRY',
      availability:
        listing.status === 'sold'
          ? 'https://schema.org/SoldOut'
          : 'https://schema.org/InStock',
      url: sitePath(`/listing/${listing.id}`),
      itemCondition: 'https://schema.org/UsedCondition',
    },
    ...(listing.city ? { areaServed: listing.city } : {}),
  };
}

export function buildItemListJsonLd(items: { id: string; title: string; image?: string }[], listName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    itemListElement: items.slice(0, 20).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: sitePath(`/listing/${item.id}`),
      name: item.title,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

export function categorySeoMeta(category: string) {
  return {
    title: `${category} İkinci El İlanları`,
    description: `${category} kategorisinde ikinci el alım satım ilanları. Pazaryeri'de ücretsiz ${category.toLowerCase()} ilanı verin veya hemen satın alın. Güvenli mesajlaşma ile alışveriş yapın.`,
    path: `/kesfet?kategori=${encodeURIComponent(category)}`,
  };
}

export function searchSeoMeta(query: string) {
  return {
    title: `"${query}" İkinci El Arama Sonuçları`,
    description: `"${query}" araması için ikinci el ilanlar. Pazaryeri'de alım satım yapın, ücretsiz ilan verin.`,
    path: `/kesfet?q=${encodeURIComponent(query)}`,
  };
}

export function listingSeoMeta(listing: {
  id: string;
  title: string;
  description?: string;
  price: number;
  city?: string | null;
  category?: string;
  image?: string;
}) {
  const location = listing.city ? ` — ${listing.city}` : '';
  const category = listing.category ? ` | ${listing.category}` : '';
  return {
    title: `${listing.title}${location}`,
    description:
      listing.description?.slice(0, 155) ||
      `${listing.title} ikinci el ilan${category}. Pazaryeri'de güvenli alım satım. Fiyat: ${listing.price} TL.`,
    path: `/listing/${listing.id}`,
    image: listing.image,
  };
}

export function getSitemapCategoryPaths(): string[] {
  return WEB_CATEGORIES.filter((c) => c.label !== 'Tüm İlanlar').map((c) => c.href);
}

export function getSitemapSearchPaths(): string[] {
  return SEO_POPULAR_SEARCHES.map((s) => `/kesfet?q=${encodeURIComponent(s.query)}`);
}

export { LISTING_CATEGORIES, WEB_CATEGORIES };
