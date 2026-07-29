export const THEME = {
  bg: '#F4F6FA',
  bgSoft: '#EEF1F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: 'rgba(255, 255, 255, 0.96)',
  border: '#E2E8F0',
  borderSoft: '#EDF2F7',
  primary: '#6D28D9',
  primaryDark: '#5B21B6',
  primaryLight: '#EDE9FE',
  gold: '#B45309',
  goldLight: '#92400E',
  goldMuted: '#FEF3C7',
  text: '#1E293B',
  textSoft: '#475569',
  textMuted: '#64748B',
  success: '#059669',
  successBg: '#D1FAE5',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  info: '#2563EB',
  infoBg: '#DBEAFE',
  accent: '#DB2777',
  accentBg: '#FCE7F3',
  accentCyan: '#0891B2',
  accentViolet: '#7C3AED',
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
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  tab: {
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;
