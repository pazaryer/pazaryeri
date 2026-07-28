import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { buildApiUrl, sitePath } from './config';
import { getFirebaseAuth } from './firebase';
import { resolveGoogleWebClientId } from './google-client-id';

WebBrowser.maybeCompleteAuthSession();

const ANDROID_BRIDGE_PATH = '/oauth/app-return';

/** Expo Go / production için native OAuth dönüş URI'si (exp:// veya pazaryeri://auth). */
export function getNativeOAuthRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'pazaryeri',
    path: 'auth',
  });
}

/**
 * Render API'ye verilen return URL.
 * Android: HTTPS köprü (Custom Tab güvenilir kapanır, Gmail açılmaz).
 * iOS: doğrudan native scheme.
 */
export function getApiOAuthReturnUri(): string {
  const native = getNativeOAuthRedirectUri();
  if (Platform.OS === 'android') {
    const bridge = sitePath(ANDROID_BRIDGE_PATH);
    return `${bridge}?native=${encodeURIComponent(native)}`;
  }
  return native;
}

/**
 * WebBrowser.openAuthSessionAsync ikinci parametresi — yönlendirme yakalanınca oturum kapanır.
 */
export function getBrowserOAuthRedirectUri(): string {
  if (Platform.OS === 'android') {
    return sitePath(ANDROID_BRIDGE_PATH);
  }
  return getNativeOAuthRedirectUri();
}

/** @deprecated getNativeOAuthRedirectUri kullanın */
export function getGoogleOAuthRedirectUri(): string {
  return getApiOAuthReturnUri();
}

export function getAppOAuthRedirectUri(): string {
  return getApiOAuthReturnUri();
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
 * Mobil Google giriş — Render API OAuth köprüsü.
 * Android: API → HTTPS app-return → token yakalanır veya native deep link.
 * iOS: pazaryeri://auth / exp:// deep link.
 */
export async function signInWithGoogleMobile(): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('Web için /giris kullanın');
  }

  const apiReturn = getApiOAuthReturnUri();
  const browserRedirect = getBrowserOAuthRedirectUri();
  const startUrl = `${buildApiUrl('/auth/google/start')}?return=${encodeURIComponent(apiReturn)}`;

  if (__DEV__) {
    console.log('[Google] API OAuth start:', startUrl);
    console.log('[Google] API return:', apiReturn);
    console.log('[Google] browser redirect:', browserRedirect);
    console.log('[Google] app ownership:', Constants.appOwnership);
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

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google girişi iptal edildi');
  }

  if (result.type !== 'success') {
    throw new Error('Google girişi başarısız — tekrar deneyin');
  }

  const { idToken, error } = parseOAuthReturnUrl(result.url);
  if (error) {
    throw new Error(error);
  }
  if (!idToken) {
    throw new Error('Google token alınamadı — uygulamaya dönüp tekrar deneyin');
  }

  await completeGoogleSignIn(idToken);
}

/** Deep link /auth?id_token=... ile tamamlama */
export async function completeGoogleSignInFromUrl(returnUrl: string): Promise<void> {
  const { idToken, error } = parseOAuthReturnUrl(returnUrl);
  if (error) throw new Error(error);
  if (!idToken) throw new Error('Google token alınamadı');
  await completeGoogleSignIn(idToken);
}

/** @deprecated signInWithGoogleMobile kullanın */
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
