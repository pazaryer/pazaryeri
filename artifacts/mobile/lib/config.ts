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

const PRODUCTION_API_URL = 'https://pazaryerim.onrender.com';

const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  PRODUCTION_API_URL;

export const API_BASE_URL = normalizeApiBaseUrl(String(rawApiUrl));

export function buildApiUrl(path: string): string {
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // /api/upload/image → /upload/image (çift /api önlenir)
  if (normalizedPath.startsWith('/api/')) {
    normalizedPath = normalizedPath.slice(4);
  } else if (normalizedPath === '/api') {
    normalizedPath = '/';
  }
  return `${API_BASE_URL}/api${normalizedPath}`;
}

export function sitePath(path: string): string {
  const base = SITE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
