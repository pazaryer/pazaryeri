import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { sitePath } from './config';
import { GOOGLE_WEB_CLIENT_ID } from './google-client-id';

WebBrowser.maybeCompleteAuthSession();

function isBrokenExpoProxy(url: string): boolean {
  return /auth\.expo\.io/i.test(url);
}

/**
 * Uygulamaya dönüş — auth.expo.io ASLA kullanılmaz (Expo Go'da kırık).
 */
export function getAppOAuthRedirectUri(): string {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI?.trim();
  if (fromEnv && !isBrokenExpoProxy(fromEnv)) {
    return fromEnv;
  }

  const linked = Linking.createURL('auth');
  if (linked && !isBrokenExpoProxy(linked)) {
    return linked;
  }

  return 'pazaryeri://auth';
}

export function getGoogleClientIds() {
  return { webClientId: GOOGLE_WEB_CLIENT_ID };
}

/** @deprecated use getAppOAuthRedirectUri */
export function getGoogleRedirectUri(): string {
  return getAppOAuthRedirectUri();
}

export function isMobileOAuthReturnUrl(url: string): boolean {
  if (!url || isBrokenExpoProxy(url)) return false;
  return url.startsWith('pazaryeri://') || url.startsWith('exp://');
}

function parseParam(url: string, key: string): string | null {
  const m = url.match(new RegExp(`[?&#]${key}=([^&#]+)`));
  if (!m?.[1]) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/**
 * Mobil Google giriş — pazaryeri0.web.app/oauth/mobile köprüsü (GIS).
 */
export async function promptGoogleSignIn(): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Web için /giris kullanın');
  }

  const appRedirect = getAppOAuthRedirectUri();
  const bridgeUrl = `${sitePath('/oauth/mobile')}?return=${encodeURIComponent(appRedirect)}`;

  if (__DEV__) {
    console.log('[Google OAuth] bridge =', bridgeUrl);
    console.log('[Google OAuth] return =', appRedirect);
  }

  const result = await WebBrowser.openAuthSessionAsync(bridgeUrl, appRedirect, {
    showInRecents: true,
    createTask: false,
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
    throw new Error('Google token alınamadı — tekrar deneyin');
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
