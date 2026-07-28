import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { buildApiUrl, sitePath } from './config';
import { getFirebaseAuth } from './firebase';
import { resolveGoogleWebClientId } from './google-client-id';

WebBrowser.maybeCompleteAuthSession();

const HTTPS_RETURN_PATH = '/oauth/app-return';
let oauthInFlight: Promise<void> | null = null;

/** Expo Go (exp://) veya production (pazaryeri://auth) */
export function getNativeOAuthRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'pazaryeri',
    path: 'auth',
  });
}

/**
 * Android Custom Tab exp:// yükleyemez → boş beyaz sayfa.
 * Android: HTTPS köprü (token URL'de yakalanır).
 * iOS: native deep link (sorunsuz çalışır).
 */
export function getApiOAuthReturnUri(): string {
  if (Platform.OS === 'android') {
    return sitePath(HTTPS_RETURN_PATH);
  }
  return getNativeOAuthRedirectUri();
}

export function getBrowserOAuthRedirectUri(): string {
  return getApiOAuthReturnUri();
}

export function getGoogleOAuthRedirectUri(): string {
  return getApiOAuthReturnUri();
}

export function getAppOAuthRedirectUri(): string {
  return getApiOAuthReturnUri();
}

export function isOAuthInFlight(): boolean {
  return oauthInFlight !== null;
}

export function getGoogleClientIds() {
  return { webClientId: resolveGoogleWebClientId() };
}

export function isMobileOAuthReturnUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('pazaryeri://')) return true;
  if (url.startsWith('exp://')) return true;
  if (url.startsWith('https://auth.expo.io/')) return true;
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

function waitForSignedInUser(timeoutMs = 10000): Promise<boolean> {
  if (getFirebaseAuth().currentUser) return Promise.resolve(true);
  return new Promise((resolve) => {
    const auth = getFirebaseAuth();
    const timer = setTimeout(() => {
      unsub();
      resolve(!!auth.currentUser);
    }, timeoutMs);
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        clearTimeout(timer);
        unsub();
        resolve(true);
      }
    });
  });
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

async function runGoogleOAuth(): Promise<void> {
  const apiReturn = getApiOAuthReturnUri();
  const browserRedirect = getBrowserOAuthRedirectUri();
  const startUrl = `${buildApiUrl('/auth/google/start')}?return=${encodeURIComponent(apiReturn)}`;

  if (__DEV__) {
    console.log('[Google] start:', startUrl);
    console.log('[Google] apiReturn:', apiReturn);
    console.log('[Google] browserRedirect:', browserRedirect);
    console.log('[Google] native:', getNativeOAuthRedirectUri());
  }

  if (Platform.OS === 'android') {
    try {
      await WebBrowser.warmUpAsync();
    } catch {
      /* optional */
    }
  }

  let result: WebBrowser.WebBrowserAuthSessionResult;
  try {
    result = await WebBrowser.openAuthSessionAsync(startUrl, browserRedirect, {
      preferEphemeralSession: false,
      showInRecents: false,
      createTask: false,
    });
  } finally {
    if (Platform.OS === 'android') {
      try {
        await WebBrowser.coolDownAsync();
      } catch {
        /* optional */
      }
    }
  }

  if (__DEV__) {
    console.log('[Google] session result:', result.type, result.type === 'success' ? result.url?.slice(0, 80) : '');
  }

  if (result.type === 'success') {
    const { idToken, error } = parseOAuthReturnUrl(result.url);
    if (error) throw new Error(error);
    if (idToken) {
      await completeGoogleSignIn(idToken);
      return;
    }
  }

  // iOS deep link veya gecikmeli oturum
  if (await waitForSignedInUser(8000)) return;

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google girişi iptal edildi');
  }

  throw new Error('Google girişi tamamlanamadı — tekrar deneyin');
}

export async function completeGoogleSignInFromUrl(returnUrl: string): Promise<void> {
  if (getFirebaseAuth().currentUser) return;
  const { idToken, error } = parseOAuthReturnUrl(returnUrl);
  if (error) throw new Error(error);
  if (!idToken) throw new Error('Google token alınamadı');
  await completeGoogleSignIn(idToken);
}

export async function promptGoogleSignIn(): Promise<string> {
  await signInWithGoogleMobile();
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Google girişi tamamlanamadı');
  return user.getIdToken();
}

export function useNativeGoogleAuth() {
  return {
    request: null,
    response: null,
    promptAsync: signInWithGoogleMobile,
    redirectUri: getApiOAuthReturnUri(),
    webClientId: resolveGoogleWebClientId(),
  };
}
