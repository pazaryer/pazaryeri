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

export const MOBILE_EXPLORE_CATEGORIES: {
  name: string;
  icon: string;
  gradient: [string, string];
}[] = [
  { name: 'Elektronik', icon: 'phone-portrait-outline', gradient: ['#5B4B8A', '#3D1A78'] },
  { name: 'Telefon', icon: 'call-outline', gradient: ['#6A4C93', '#4A2C7A'] },
  { name: 'Araç', icon: 'car-sport-outline', gradient: ['#7A5C3E', '#4A3520'] },
  { name: 'Emlak', icon: 'business-outline', gradient: ['#4A6FA5', '#2C4A6E'] },
  { name: 'Mobilya', icon: 'bed-outline', gradient: ['#8B6F47', '#5C4A30'] },
  { name: 'Moda', icon: 'shirt-outline', gradient: ['#9B4D7A', '#6B2D5A'] },
  { name: 'Spor', icon: 'bicycle-outline', gradient: ['#3D8B6E', '#2A5C4A'] },
  { name: 'Ev & Bahçe', icon: 'home-outline', gradient: ['#5A8F5A', '#3A6B3A'] },
];

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
  '🎉 Ücretsiz ilan ver — komisyon yok!',
  '🔒 Güvenli alışveriş — doğrudan mesajlaşma',
  '⚡ Binlerce ilan tek tıkla keşfet',
  '✨ Yeni üyelere özel: Hemen ilan ver, satışa başla',
];
