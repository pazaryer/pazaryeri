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
  image: string;
  imageThumb: string;
}[] = [
  { name: 'Elektronik', icon: 'phone-portrait-outline', gradient: ['#6B5B9A', '#3D1A78'], image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop&q=80', imageThumb: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=160&h=160&fit=crop&q=75' },
  { name: 'Telefon', icon: 'call-outline', gradient: ['#7A5CA8', '#4A2C7A'], image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&q=80', imageThumb: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&h=160&fit=crop&q=75' },
  { name: 'Bilgisayar', icon: 'laptop-outline', gradient: ['#5A6FA5', '#2C4A6E'], image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&q=80', imageThumb: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=160&h=160&fit=crop&q=75' },
  { name: 'Araç', icon: 'car-sport-outline', gradient: ['#8A6F4E', '#4A3520'], image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop&q=80', imageThumb: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=160&h=160&fit=crop&q=75' },
  { name: 'Emlak', icon: 'business-outline', gradient: ['#4A7FA5', '#2C5A7E'], image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=400&fit=crop&q=80', imageThumb: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=160&h=160&fit=crop&q=75' },
  { name: 'Mobilya', icon: 'bed-outline', gradient: ['#9B7F57', '#5C4A30'], image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&q=80', imageThumb: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=160&h=160&fit=crop&q=75' },
  { name: 'Moda', icon: 'shirt-outline', gradient: ['#AB5D8A', '#6B2D5A'], image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop&q=80', imageThumb: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=160&h=160&fit=crop&q=75' },
  { name: 'Spor', icon: 'bicycle-outline', gradient: ['#4D9B7E', '#2A5C4A'], image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop&q=80', imageThumb: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=160&h=160&fit=crop&q=75' },
  { name: 'Ev & Bahçe', icon: 'home-outline', gradient: ['#6AAF6A', '#3A6B3A'], image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&q=80', imageThumb: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=160&h=160&fit=crop&q=75' },
  { name: 'Bebek', icon: 'happy-outline', gradient: ['#E8A87C', '#C06C4A'], image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=400&fit=crop&q=80', imageThumb: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=160&h=160&fit=crop&q=75' },
  { name: 'Hobi', icon: 'book-outline', gradient: ['#7A8FA5', '#4A5A6E'], image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop&q=80', imageThumb: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=160&h=160&fit=crop&q=75' },
  { name: 'Hayvanlar', icon: 'paw-outline', gradient: ['#8B7355', '#5C4A38'], image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop&q=80', imageThumb: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=160&h=160&fit=crop&q=75' },
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
