import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { buildApiUrl } from './config';
import { getFirebaseAuth } from './firebase';
import { resolveGoogleWebClientId } from './google-client-id';

WebBrowser.maybeCompleteAuthSession();

let oauthInFlight: Promise<void> | null = null;

/** Expo Go (exp://) veya production (pazaryeri://auth) dönüş adresi. */
export function getNativeOAuthRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'pazaryeri',
    path: 'auth',
  });
}

/** API ve tarayıcı oturumu aynı native URI kullanır — döngü önlenir. */
export function getApiOAuthReturnUri(): string {
  return getNativeOAuthRedirectUri();
}

export function getBrowserOAuthRedirectUri(): string {
  return getNativeOAuthRedirectUri();
}

export function getGoogleOAuthRedirectUri(): string {
  return getNativeOAuthRedirectUri();
}

export function getAppOAuthRedirectUri(): string {
  return getNativeOAuthRedirectUri();
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

/**
 * Mobil Google giriş — Render API OAuth.
 * Native deep link (exp:// veya pazaryeri://auth) ile tek adımda döner.
 */
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
  const redirectUri = getNativeOAuthRedirectUri();
  const startUrl = `${buildApiUrl('/auth/google/start')}?return=${encodeURIComponent(redirectUri)}`;

  if (__DEV__) {
    console.log('[Google] API OAuth start:', startUrl);
    console.log('[Google] redirect:', redirectUri);
    console.log('[Google] ownership:', Constants.appOwnership);
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
    result = await WebBrowser.openAuthSessionAsync(startUrl, redirectUri, {
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

  if (result.type === 'success') {
    const { idToken, error } = parseOAuthReturnUrl(result.url);
    if (error) throw new Error(error);
    if (idToken) {
      await completeGoogleSignIn(idToken);
      return;
    }
  }

  // Custom Tab kapandıysa deep link /auth ekranı işlemiş olabilir
  const user = getFirebaseAuth().currentUser;
  if (user) return;

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google girişi iptal edildi');
  }

  throw new Error('Google girişi başarısız — tekrar deneyin');
}

/** Deep link /auth?id_token=... ile tamamlama (yedek) */
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
    redirectUri: getNativeOAuthRedirectUri(),
    webClientId: resolveGoogleWebClientId(),
  };
}
