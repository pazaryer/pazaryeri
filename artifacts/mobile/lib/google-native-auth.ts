import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  '637257074433-gr8vbeupacshsv6omnfsf60mn5rkef719.apps.googleusercontent.com';

export function getGoogleClientIds() {
  return { webClientId: GOOGLE_CLIENT_ID };
}

/** Expo Go: https://auth.expo.io/@pazaryeri/pazaryeri — Google Console'a ekleyin */
export function getGoogleRedirectUri(): string {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI;
  if (fromEnv?.startsWith('https://auth.expo.io/')) {
    return fromEnv;
  }

  if (Constants.appOwnership === 'expo') {
    const owner = Constants.expoConfig?.owner ?? 'pazaryeri';
    const slug = Constants.expoConfig?.slug ?? 'pazaryeri';
    return `https://auth.expo.io/@${owner}/${slug}`;
  }

  return makeRedirectUri({ scheme: 'pazaryeri', path: 'auth' });
}

export function isMobileOAuthReturnUrl(url: string): boolean {
  return url.startsWith('pazaryeri://') || url.startsWith('https://auth.expo.io/');
}

/**
 * Doğrudan Google hesap seçici — web sitesi açılmaz, accounts.google.com açılır.
 */
export async function promptGoogleSignIn(): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Web için /giris kullanın');
  }

  const { webClientId } = getGoogleClientIds();
  const redirectUri = getGoogleRedirectUri();

  if (__DEV__) {
    console.log('[Google OAuth] redirect_uri =', redirectUri);
    console.log('[Google OAuth] client_id =', webClientId);
  }

  const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');

  const request = new AuthSession.AuthRequest({
    clientId: webClientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      access_type: 'online',
      prompt: 'select_account',
    },
  });

  const result = await request.promptAsync(discovery, { showInRecents: true });

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google girişi iptal edildi');
  }

  if (result.type === 'error') {
    const msg =
      result.params?.error_description ??
      result.params?.error ??
      result.error?.message ??
      'Google girişi başarısız';
    throw new Error(String(msg));
  }

  if (result.type !== 'success' || !result.params.code) {
    throw new Error('Google girişi başarısız');
  }

  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: webClientId,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    discovery,
  );

  if (!tokenResult.idToken) {
    throw new Error('Google token alınamadı');
  }

  return tokenResult.idToken;
}

export function useNativeGoogleAuth() {
  const redirectUri = getGoogleRedirectUri();
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
