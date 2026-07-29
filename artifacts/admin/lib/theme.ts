export const THEME = {
  bg: '#08050F',
  bgSoft: '#0F0A1A',
  surface: '#16102A',
  surfaceElevated: '#1E1635',
  surfaceGlass: 'rgba(30, 22, 53, 0.92)',
  border: 'rgba(201, 168, 76, 0.18)',
  borderSoft: 'rgba(157, 139, 181, 0.12)',
  primary: '#8B5CF6',
  primaryDark: '#6D28D9',
  gold: '#D4AF37',
  goldLight: '#F5E6B8',
  goldMuted: 'rgba(212, 175, 55, 0.15)',
  text: '#FAF8FF',
  textSoft: '#E8E0F4',
  textMuted: '#A99BC4',
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.12)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.12)',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.12)',
  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.12)',
  accent: '#EC4899',
  accentBg: 'rgba(236, 72, 153, 0.12)',
  accentCyan: '#22D3EE',
  accentViolet: '#A78BFA',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  tab: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
} as const;
