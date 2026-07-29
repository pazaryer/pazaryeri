import Constants from 'expo-constants';

const PRODUCTION_API_URL = 'https://pazaryerim.onrender.com';

const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  PRODUCTION_API_URL;

export const API_BASE_URL = String(rawApiUrl).trim().replace(/\/+$/, '').replace(/\/api$/, '');

export function buildApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const normalized = p.startsWith('/api/') ? p : `/api${p}`;
  return `${API_BASE_URL}${normalized}`;
}
