import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { API_BASE_URL } from './config';

WebBrowser.maybeCompleteAuthSession();

export function getGoogleAppRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'pazaryeri',
    path: 'auth',
  });
}

export async function signInWithGoogleViaApi(): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Web için signInWithGoogleWeb kullanın');
  }

  const appRedirect = getGoogleAppRedirectUri();
  const authUrl = `${API_BASE_URL}/api/auth/google/mobile?app_redirect=${encodeURIComponent(appRedirect)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, appRedirect);

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
