import { BRAND } from '@/constants/brand';

/** Pazaryeri web tasarım tokenları */
export const WEB_THEME = {
  bg: BRAND.background,
  surface: BRAND.surface,
  text: BRAND.text,
  textMuted: BRAND.textMuted,
  textLight: BRAND.textLight,
  border: BRAND.border,
  borderLight: BRAND.primaryLight,
  brand: BRAND.primary,
  brandDark: BRAND.primaryDark,
  brandMid: BRAND.primaryMid,
  brandLight: BRAND.primaryLight,
  gold: BRAND.gold,
  goldLight: BRAND.goldLight,
  cta: BRAND.primary,
  ctaText: '#FFFFFF',
  heroFrom: BRAND.primary,
  heroTo: BRAND.primaryMid,
  sectionTint: '#FAF8FD',
  radius: 12,
  radiusPill: 24,
  radiusCard: 16,
  maxWidth: 1200,
  mobileBreakpoint: 640,
  tabletBreakpoint: 1024,
} as const;
