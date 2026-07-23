/**
 * @deprecated Mobil için `google-native-auth.ts` kullanın.
 * Web köprüsü (pazaryeri0.web.app) artık iOS/Android'de kullanılmıyor.
 */
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { SITE_URL } from './config';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_BRIDGE_URL = 'https://pazaryeri0.web.app/oauth/google';

export function getGoogleAppRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'pazaryeri',
    path: 'auth',
  });
}

/** Expo Go / mobil: pazaryeri0.web.app üzerinden Google girişi (Render API değil) */
export async function signInWithGoogleViaWebBridge(): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Web için signInWithGoogleWeb kullanın');
  }

  const appRedirect = getGoogleAppRedirectUri();
  const siteBase = (SITE_URL || GOOGLE_BRIDGE_URL.replace('/oauth/google', '')).replace(/\/$/, '');
  const bridgeUrl = `${siteBase}/oauth/google?return=${encodeURIComponent(appRedirect)}`;

  const result = await WebBrowser.openAuthSessionAsync(bridgeUrl, appRedirect, {
    preferEphemeralSession: false,
    showInRecents: true,
  });

  if (result.type !== 'success') {
    throw new Error('Google girişi iptal edildi');
  }

  const url = new URL(result.url);
  const error = url.searchParams.get('error');
  if (error) {
    throw new Error(decodeURIComponent(error));
  }

  const idToken = url.searchParams.get('id_token');
  if (!idToken) {
    throw new Error('Google token alınamadı');
  }

  return idToken;
}
