import type { ImageSource } from 'expo-image';

/** Firebase Hosting — APK/OTA'da güvenilir uzak kategori görselleri */
const CAT_CDN = 'https://pazaryeri0.web.app/categories';

export const CATEGORY_ALL_IMAGE: ImageSource = { uri: `${CAT_CDN}/tumu.jpg` };

export interface CategoryItem {
  label: string;
  icon: string;
  href: string;
}

export const LISTING_CATEGORIES = [
  'Tümü',
  'Elektronik',
  'Telefon',
  'Bilgisayar',
  'Araç',
  'Emlak',
  'Mobilya',
  'Ev & Bahçe',
  'Moda',
  'Spor',
  'Bebek',
  'Hobi',
  'İş & Ofis',
  'Hayvanlar',
  'Müzik',
  'Beyaz Eşya',
  'Kozmetik',
  'Antika',
  'Diğer',
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export type CategoryIconName =
  | 'phone-portrait-outline'
  | 'call-outline'
  | 'laptop-outline'
  | 'car-sport-outline'
  | 'business-outline'
  | 'bed-outline'
  | 'home-outline'
  | 'shirt-outline'
  | 'bicycle-outline'
  | 'happy-outline'
  | 'book-outline'
  | 'briefcase-outline'
  | 'paw-outline'
  | 'musical-notes-outline'
  | 'snow-outline'
  | 'color-palette-outline'
  | 'diamond-outline'
  | 'grid-outline'
  | 'sparkles-outline'
  | 'gift-outline';

export const CATEGORY_ICON_MAP: Record<string, CategoryIconName> = {
  Elektronik: 'phone-portrait-outline',
  Telefon: 'call-outline',
  Bilgisayar: 'laptop-outline',
  Araç: 'car-sport-outline',
  Emlak: 'business-outline',
  Mobilya: 'bed-outline',
  'Ev & Bahçe': 'home-outline',
  Moda: 'shirt-outline',
  Spor: 'bicycle-outline',
  Bebek: 'happy-outline',
  Hobi: 'book-outline',
  'İş & Ofis': 'briefcase-outline',
  Hayvanlar: 'paw-outline',
  Müzik: 'musical-notes-outline',
  'Beyaz Eşya': 'snow-outline',
  Kozmetik: 'color-palette-outline',
  Antika: 'diamond-outline',
  Diğer: 'grid-outline',
};

export const MOBILE_EXPLORE_CATEGORIES: {
  name: string;
  icon: CategoryIconName;
  gradient: [string, string];
  imageThumb: ImageSource;
}[] = [
  { name: 'Elektronik', icon: 'phone-portrait-outline', gradient: ['#6B5B9A', '#3D1A78'], imageThumb: { uri: `${CAT_CDN}/elektronik.jpg` } },
  { name: 'Telefon', icon: 'call-outline', gradient: ['#7A5CA8', '#4A2C7A'], imageThumb: { uri: `${CAT_CDN}/telefon.jpg` } },
  { name: 'Bilgisayar', icon: 'laptop-outline', gradient: ['#5A6FA5', '#2C4A6E'], imageThumb: { uri: `${CAT_CDN}/bilgisayar.jpg` } },
  { name: 'Araç', icon: 'car-sport-outline', gradient: ['#8A6F4E', '#4A3520'], imageThumb: { uri: `${CAT_CDN}/arac.jpg` } },
  { name: 'Emlak', icon: 'business-outline', gradient: ['#4A7FA5', '#2C5A7E'], imageThumb: { uri: `${CAT_CDN}/emlak.jpg` } },
  { name: 'Mobilya', icon: 'bed-outline', gradient: ['#9B7F57', '#5C4A30'], imageThumb: { uri: `${CAT_CDN}/mobilya.jpg` } },
  { name: 'Moda', icon: 'shirt-outline', gradient: ['#AB5D8A', '#6B2D5A'], imageThumb: { uri: `${CAT_CDN}/moda.jpg` } },
  { name: 'Spor', icon: 'bicycle-outline', gradient: ['#4D9B7E', '#2A5C4A'], imageThumb: { uri: `${CAT_CDN}/spor.jpg` } },
  { name: 'Ev & Bahçe', icon: 'home-outline', gradient: ['#6AAF6A', '#3A6B3A'], imageThumb: { uri: `${CAT_CDN}/ev-bahce.jpg` } },
  { name: 'Bebek', icon: 'happy-outline', gradient: ['#E8A87C', '#C06C4A'], imageThumb: { uri: `${CAT_CDN}/bebek.jpg` } },
  { name: 'Hobi', icon: 'book-outline', gradient: ['#7A8FA5', '#4A5A6E'], imageThumb: { uri: `${CAT_CDN}/hobi.jpg` } },
  { name: 'Hayvanlar', icon: 'paw-outline', gradient: ['#8B7355', '#5C4A38'], imageThumb: { uri: `${CAT_CDN}/hayvanlar.jpg` } },
];

export function getCategoryIcon(name: string): CategoryIconName {
  return CATEGORY_ICON_MAP[name] ?? 'grid-outline';
}

export const WEB_CATEGORIES: CategoryItem[] = [
  { label: 'Tüm İlanlar', icon: '📋', href: '/kesfet' },
  { label: 'Elektronik', icon: '📱', href: '/kesfet?kategori=Elektronik' },
  { label: 'Telefon', icon: '📲', href: '/kesfet?kategori=Telefon' },
  { label: 'Bilgisayar', icon: '💻', href: '/kesfet?kategori=Bilgisayar' },
  { label: 'Araç', icon: '🚗', href: '/kesfet?kategori=Ara%C3%A7' },
  { label: 'Emlak', icon: '🏠', href: '/kesfet?kategori=Emlak' },
  { label: 'Mobilya', icon: '🛋️', href: '/kesfet?kategori=Mobilya' },
  { label: 'Ev & Bahçe', icon: '🏡', href: '/kesfet?kategori=Ev%20%26%20Bah%C3%A7e' },
  { label: 'Moda', icon: '👗', href: '/kesfet?kategori=Moda' },
  { label: 'Spor', icon: '⚽', href: '/kesfet?kategori=Spor' },
  { label: 'Bebek', icon: '👶', href: '/kesfet?kategori=Bebek' },
  { label: 'Hobi', icon: '📚', href: '/kesfet?kategori=Hobi' },
  { label: 'İş & Ofis', icon: '💼', href: '/kesfet?kategori=%C4%B0%C5%9F%20%26%20Ofis' },
  { label: 'Hayvanlar', icon: '🐾', href: '/kesfet?kategori=Hayvanlar' },
  { label: 'Müzik', icon: '🎸', href: '/kesfet?kategori=M%C3%BCzik' },
  { label: 'Beyaz Eşya', icon: '❄️', href: '/kesfet?kategori=Beyaz%20E%C5%9Fya' },
  { label: 'Kozmetik', icon: '💄', href: '/kesfet?kategori=Kozmetik' },
  { label: 'Antika', icon: '🏺', href: '/kesfet?kategori=Antika' },
];

export const ANNOUNCEMENTS = [
  'Ücretsiz ilan ver — komisyon yok, hemen sat!',
  'Yakınındaki fırsatları kaçırma, keşfet',
  'Mesaj ve teklifler anında cebinde',
  'Güvenli ikinci el alışveriş — doğrudan mesajlaş',
  'Bugün ilan ver, yarın kazan',
  'Binlerce ilan seni bekliyor',
];
