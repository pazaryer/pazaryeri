import colors from '@/constants/colors';

/**
 * Pazaryeri mobil tasarımı tek (açık) palet kullanır.
 * Karanlık mod cihaz ayarıyla karışık siyah/beyaz/mor görünümü önlenir.
 */
export function useColors() {
  return { ...colors.light, radius: colors.radius };
}
