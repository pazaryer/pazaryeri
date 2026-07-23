import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import { API_BASE_URL } from './config';
import { GOOGLE_WEB_CLIENT_ID } from './google-client-id';

WebBrowser.maybeCompleteAuthSession();

/** Expo Go: exp://... — auth.expo.io kullanılmaz (sık "something went wrong" verir) */
export function getAppOAuthRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'pazaryeri',
    path: 'auth',
    preferLocalhost: false,
  });
}

export function getGoogleClientIds() {
  return { webClientId: GOOGLE_WEB_CLIENT_ID };
}

/** @deprecated use getAppOAuthRedirectUri */
export function getGoogleRedirectUri(): string {
  return getAppOAuthRedirectUri();
}

export function isMobileOAuthReturnUrl(url: string): boolean {
  return (
    url.startsWith('pazaryeri://') ||
    url.startsWith('exp://') ||
    url.startsWith('https://auth.expo.io/')
  );
}

function parseParam(url: string, key: string): string | null {
  const patterns = [
    new RegExp(`[?&#]${key}=([^&#]+)`),
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) {
      try {
        return decodeURIComponent(m[1]);
      } catch {
        return m[1];
      }
    }
  }
  return null;
}

/**
 * Mobil Google giriş — API OAuth (Render callback).
 * Google → pazaryerim.onrender.com/api/auth/google/callback → uygulama (id_token).
 */
export async function promptGoogleSignIn(): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Web için /giris kullanın');
  }

  const returnUrl = getAppOAuthRedirectUri();
  const startUrl = `${API_BASE_URL}/api/auth/google/start?return=${encodeURIComponent(returnUrl)}`;

  if (__DEV__) {
    console.log('[Google OAuth] start =', startUrl);
    console.log('[Google OAuth] return =', returnUrl);
  }

  const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl, {
    showInRecents: true,
  });

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google girişi iptal edildi');
  }

  if (result.type !== 'success' || !result.url) {
    throw new Error('Google girişi başarısız');
  }

  const oauthError = parseParam(result.url, 'error');
  if (oauthError) {
    throw new Error(oauthError);
  }

  const idToken = parseParam(result.url, 'id_token');
  if (!idToken) {
    throw new Error('Google token alınamadı — uygulamayı yeniden başlatıp tekrar deneyin');
  }

  return idToken;
}

export function useNativeGoogleAuth() {
  const redirectUri = getAppOAuthRedirectUri();
  const { webClientId } = getGoogleClientIds();
  return {
    request: null,
    response: null,
    promptAsync: promptGoogleSignIn,
    redirectUri,
    webClientId,
  };
}

export function extractGoogleIdToken(_response: unknown): string | null {
  return null;
}

export function isGoogleAuthCancelled(_response: unknown): boolean {
  return false;
}

export function getGoogleAuthErrorMessage(_response: unknown): string {
  return 'Google girişi başarısız';
}
