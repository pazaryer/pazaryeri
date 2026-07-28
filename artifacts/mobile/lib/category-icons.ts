export const CATEGORY_EMOJI: Record<string, string> = {
  Tümü: '📋',
  Elektronik: '📱',
  Telefon: '📲',
  Bilgisayar: '💻',
  Araç: '🚗',
  Emlak: '🏠',
  Mobilya: '🛋️',
  'Ev & Bahçe': '🏡',
  Moda: '👗',
  Spor: '⚽',
  Bebek: '👶',
  Hobi: '📚',
  'İş & Ofis': '💼',
  Hayvanlar: '🐾',
  Müzik: '🎸',
  'Beyaz Eşya': '❄️',
  Kozmetik: '💄',
  Antika: '🏺',
  Diğer: '📦',
};

export function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? '📦';
}
