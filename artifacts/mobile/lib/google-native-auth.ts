import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { buildApiUrl } from './config';
import { getFirebaseAuth } from './firebase';
import { resolveGoogleWebClientId } from './google-client-id';

WebBrowser.maybeCompleteAuthSession();

/**
 * Expo Go ve production build için uygulama dönüş URI'si.
 * auth.expo.io proxy kullanılmaz — Render API OAuth köprüsü tercih edilir.
 */
export function getGoogleOAuthRedirectUri(): string {
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
  return (
    url.startsWith('pazaryeri://') ||
    url.startsWith('exp://') ||
    url.startsWith('https://auth.expo.io/')
  );
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
 * Mobil Google giriş — Render API OAuth köprüsü (auth.expo.io yerine).
 * Google hesabı seçildikten sonra pazaryeri:// veya exp:// ile uygulamaya döner.
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

  const result = await WebBrowser.openAuthSessionAsync(startUrl, appRedirect, {
    preferEphemeralSession: false,
    showInRecents: false,
  });

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
