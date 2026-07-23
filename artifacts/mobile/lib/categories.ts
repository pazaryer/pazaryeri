export interface CategoryItem {
  label: string;
  icon: string;
  href: string;
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
  '🎉 Ücretsiz ilan ver — komisyon yok!',
  '🔒 Güvenli alışveriş — doğrudan mesajlaşma',
  '⚡ Binlerce ilan tek tıkla keşfet',
  '✨ Yeni üyelere özel: Hemen ilan ver, satışa başla',
];
