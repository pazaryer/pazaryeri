import colors from '@/constants/colors';
import { useBrand } from '@/contexts/BrandContext';

/**
 * Pazaryeri mobil tasarımı tek (açık) palet kullanır.
 * Renkler admin panelinden uzaktan güncellenebilir.
 */
export function useColors() {
  const brand = useBrand();
  return {
    ...colors.light,
    background: brand.background,
    foreground: brand.text,
    card: brand.surface,
    cardForeground: brand.text,
    primary: brand.primary,
    secondary: brand.primaryLight,
    secondaryForeground: brand.primary,
    muted: brand.primaryLight,
    mutedForeground: brand.textMuted,
    accent: brand.gold,
    accentForeground: brand.text,
    destructive: brand.destructive,
    border: brand.border,
    input: brand.border,
    text: brand.text,
    tint: brand.primary,
    radius: colors.radius,
  };
}
