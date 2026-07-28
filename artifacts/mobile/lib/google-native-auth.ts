import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { buildApiUrl, sitePath } from './config';
import { getFirebaseAuth } from './firebase';
import { resolveGoogleWebClientId } from './google-client-id';

WebBrowser.maybeCompleteAuthSession();

/** Android Custom Tabs özel şemayı (pazaryeri://) güvenilir yakalamaz — HTTPS dönüş kullan. */
const ANDROID_OAUTH_RETURN_PATH = '/oauth/app-return';

/**
 * Expo Go ve production build için OAuth dönüş URI'si.
 */
export function getGoogleOAuthRedirectUri(): string {
  if (Platform.OS === 'android') {
    return sitePath(ANDROID_OAUTH_RETURN_PATH);
  }
  return AuthSession.makeRedirectUri({
    scheme: 'pazaryeri',
    path: 'auth',
  });
}

export function getAppOAuthRedirectUri(): string {
  return getGoogleOAuthRedirectUri();
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

function parseOAuthReturnUrl(returnUrl: string): { idToken?: string; error?: string } {
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

/**
 * Mobil Google giriş — Render API OAuth köprüsü.
 * Android: HTTPS app-return ile Custom Tab oturumu kapanır.
 * iOS: pazaryeri://auth deep link.
 */
export async function signInWithGoogleMobile(): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('Web için /giris kullanın');
  }

  const appRedirect = getGoogleOAuthRedirectUri();
  const startUrl = `${buildApiUrl('/auth/google/start')}?return=${encodeURIComponent(appRedirect)}`;

  if (__DEV__) {
    console.log('[Google] API OAuth start:', startUrl);
    console.log('[Google] app redirect:', appRedirect);
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
    result = await WebBrowser.openAuthSessionAsync(startUrl, appRedirect, {
      preferEphemeralSession: false,
      showInRecents: false,
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
    throw new Error('Google token alınamadı — tekrar deneyin');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(getFirebaseAuth(), credential);
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
    redirectUri: getGoogleOAuthRedirectUri(),
    webClientId: resolveGoogleWebClientId(),
  };
}
