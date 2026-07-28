import { useCallback } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { buildApiUrl, sitePath } from './config';
import { getFirebaseAuth } from './firebase';
import { resolveGoogleWebClientId } from './google-client-id';

WebBrowser.maybeCompleteAuthSession();

const HTTPS_RETURN_URL = sitePath('/oauth/app-return');
const webClientId = resolveGoogleWebClientId();

let oauthInFlight: Promise<void> | null = null;

export function getNativeOAuthRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'pazaryeri',
    path: 'auth',
  });
}

/** Android: HTTPS (tab kapanır). iOS: exp:// (doğrudan uygulama). */
export function getOAuthReturnUrl(): string {
  if (Platform.OS === 'android') {
    return HTTPS_RETURN_URL;
  }
  return getNativeOAuthRedirectUri();
}

export function getApiOAuthReturnUri(): string {
  return getOAuthReturnUrl();
}

export function getBrowserOAuthRedirectUri(): string {
  return getOAuthReturnUrl();
}

export function getGoogleOAuthRedirectUri(): string {
  return getOAuthReturnUrl();
}

export function getAppOAuthRedirectUri(): string {
  return getOAuthReturnUrl();
}

export function isOAuthInFlight(): boolean {
  return oauthInFlight !== null;
}

export function getGoogleClientIds() {
  return { webClientId };
}

export function isMobileOAuthReturnUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('pazaryeri://')) return true;
  if (url.startsWith('exp://')) return true;
  if (url.includes('/oauth/app-return')) return true;
  return false;
}

export function parseOAuthReturnUrl(returnUrl: string): { idToken?: string; error?: string } {
  try {
    const url = new URL(returnUrl);
    const error = url.searchParams.get('error');
    if (error) return { error: decodeURIComponent(error) };
    const idToken = url.searchParams.get('id_token');
    if (idToken) return { idToken };
    return {};
  } catch {
    const idMatch = returnUrl.match(/[?&]id_token=([^&]+)/);
    if (idMatch?.[1]) return { idToken: decodeURIComponent(idMatch[1]) };
    const errMatch = returnUrl.match(/[?&]error=([^&]+)/);
    if (errMatch?.[1]) return { error: decodeURIComponent(errMatch[1]) };
    return {};
  }
}

async function completeGoogleSignIn(idToken: string): Promise<void> {
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(getFirebaseAuth(), credential);
}

/** API'den Google hesap seçici URL'si — auth.expo.io yok */
async function fetchGoogleAuthUrl(returnUrl: string): Promise<string> {
  const endpoint = `${buildApiUrl('/auth/google/url')}?return=${encodeURIComponent(returnUrl)}`;
  try {
    const res = await fetch(endpoint);
    const data = (await res.json()) as { url?: string; error?: string };
    if (res.ok && data.url) return data.url;
    if (data.error) throw new Error(data.error);
  } catch (e) {
    if (e instanceof Error && e.message !== 'Network request failed') throw e;
  }
  // Eski API (url endpoint henüz deploy edilmediyse)
  return `${buildApiUrl('/auth/google/start')}?return=${encodeURIComponent(returnUrl)}`;
}

async function runGoogleOAuth(): Promise<void> {
  const returnUrl = getOAuthReturnUrl();
  const googleUrl = await fetchGoogleAuthUrl(returnUrl);

  if (__DEV__) {
    console.log('[Google] platform:', Platform.OS);
    console.log('[Google] return:', returnUrl);
    console.log('[Google] googleUrl:', googleUrl.slice(0, 80));
  }

  if (Platform.OS === 'android') {
    try {
      await WebBrowser.warmUpAsync();
    } catch {
      /* ignore */
    }
  }

  let result: WebBrowser.WebBrowserAuthSessionResult;
  try {
    result = await WebBrowser.openAuthSessionAsync(googleUrl, returnUrl, {
      preferEphemeralSession: Platform.OS === 'ios',
      showInRecents: false,
      createTask: false,
    });
  } finally {
    if (Platform.OS === 'android') {
      try {
        await WebBrowser.coolDownAsync();
      } catch {
        /* ignore */
      }
    }
  }

  if (__DEV__) {
    console.log('[Google] result:', result.type);
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google girişi iptal edildi');
  }
  if (result.type !== 'success') {
    throw new Error('Google girişi başarısız');
  }

  const { idToken, error } = parseOAuthReturnUrl(result.url);
  if (error) throw new Error(error);
  if (!idToken) throw new Error('Google token alınamadı');

  await completeGoogleSignIn(idToken);
}

export function useGoogleSignIn() {
  const signIn = useCallback(async () => {
    if (oauthInFlight) return oauthInFlight;

    oauthInFlight = runGoogleOAuth();
    try {
      await oauthInFlight;
    } finally {
      oauthInFlight = null;
    }
  }, []);

  return { signIn, ready: true, redirectUri: getOAuthReturnUrl() };
}

export async function signInWithGoogleMobile(): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('Web için /giris kullanın');
  }
  if (oauthInFlight) return oauthInFlight;
  oauthInFlight = runGoogleOAuth();
  try {
    await oauthInFlight;
  } finally {
    oauthInFlight = null;
  }
}

export async function completeGoogleSignInFromUrl(returnUrl: string): Promise<void> {
  if (getFirebaseAuth().currentUser) return;
  const { idToken, error } = parseOAuthReturnUrl(returnUrl);
  if (error) throw new Error(error);
  if (!idToken) throw new Error('Google token alınamadı');
  await completeGoogleSignIn(idToken);
}

export function useNativeGoogleAuth() {
  const { signIn, ready, redirectUri } = useGoogleSignIn();
  return {
    request: ready,
    response: null,
    promptAsync: signIn,
    redirectUri,
    webClientId,
  };
}

export { HTTPS_RETURN_URL as OAUTH_HTTPS_RETURN_URL };
