import Constants from 'expo-constants';

export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ??
  Constants.expoConfig?.extra?.siteUrl ??
  'https://pazaryeri0.web.app';

function normalizeApiBaseUrl(url: string): string {
  let base = url.trim().replace(/\/+$/, '');
  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }
  return base;
}

const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://localhost:5000';

export const API_BASE_URL = normalizeApiBaseUrl(rawApiUrl);

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}/api${normalizedPath}`;
}

export function sitePath(path: string): string {
  const base = SITE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
