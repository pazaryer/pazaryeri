import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';
import { API_BASE_URL, buildApiUrl } from './config';
import { getFirebaseAuth } from './firebase';

let initialized = false;

async function getIdToken(): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export function initApi() {
  if (initialized) return;
  setBaseUrl(API_BASE_URL);
  setAuthTokenGetter(getIdToken);
  initialized = true;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  initApi();
  const token = await getIdToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = buildApiUrl(path);
  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail =
      typeof err.error === 'string'
        ? err.error
        : typeof err.message === 'string'
          ? err.message
          : null;
    const message = detail
      ? `${detail} (HTTP ${res.status})`
      : `İstek başarısız (HTTP ${res.status}) — ${url}`;
    throw new Error(message);
  }

  return res.json();
}
