import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';
import { API_BASE_URL } from './config';
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

  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'İstek başarısız' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}
