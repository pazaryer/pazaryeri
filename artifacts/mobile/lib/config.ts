import Constants from 'expo-constants';

export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ??
  Constants.expoConfig?.extra?.siteUrl ??
  'https://pazaryeri0.web.app';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://localhost:5000';

export function sitePath(path: string): string {
  const base = SITE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
