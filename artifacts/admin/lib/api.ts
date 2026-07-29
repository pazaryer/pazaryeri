import Constants from 'expo-constants';
import { getFirebaseAuth } from './firebase';
import { buildApiUrl, API_BASE_URL } from './config';

export { API_BASE_URL };

async function parseResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof (body as { error?: string }).error === 'string'
        ? (body as { error: string }).error
        : null;
    if (res.status === 404) {
      throw new Error(detail ?? 'Admin API sunucuda bulunamadı (404). API güncellemesi gerekli.');
    }
    if (res.status === 403) {
      throw new Error(detail ?? 'Admin yetkisi yok. Hesabınıza admin rolü atanmalı.');
    }
    throw new Error(detail ?? `İstek başarısız (HTTP ${res.status})`);
  }
  return body as T;
}

export async function getIdToken(): Promise<string | null> {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) return null;
    return user.getIdToken();
  } catch {
    return null;
  }
}

export async function publicFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(buildApiUrl(path), { ...options, headers });
  return parseResponse<T>(res);
}

export async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  if (!token) throw new Error('Oturum gerekli');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  headers.Authorization = `Bearer ${token}`;

  const res = await fetch(buildApiUrl(path), { ...options, headers });
  return parseResponse<T>(res);
}

/** @deprecated use authFetch */
export const adminFetch = authFetch;

export async function checkApiHealth(): Promise<{ ok: boolean; adminApi: boolean }> {
  try {
    const health = await publicFetch<{ status?: string }>('/healthz');
    let adminApi = false;
    try {
      const res = await fetch(buildApiUrl('/admin/me'));
      adminApi = res.status !== 404;
    } catch {
      adminApi = false;
    }
    return { ok: health?.status === 'ok', adminApi };
  } catch {
    return { ok: false, adminApi: false };
  }
}

export function getBootstrapAdminEmails(): string[] {
  const raw =
    process.env.EXPO_PUBLIC_ADMIN_EMAILS ??
    (Constants.expoConfig?.extra?.bootstrapAdminEmails as string[] | undefined) ??
    [];
  return raw.map((e) => e.trim().toLowerCase()).filter(Boolean);
}
