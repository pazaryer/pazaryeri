import { useCallback } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { buildApiUrl } from './config';
import { getFirebaseAuth } from './firebase';
import { resolveGoogleWebClientId } from './google-client-id';

WebBrowser.maybeCompleteAuthSession();

const webClientId = resolveGoogleWebClientId();
let oauthInFlight: Promise<void> | null = null;

export function getNativeOAuthRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'pazaryeri',
    path: 'auth',
  });
}

export function getOAuthReturnUrl(): string {
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

async function safeDismissBrowser(): Promise<void> {
  try {
    const maybe = WebBrowser.dismissBrowser() as void | Promise<void>;
    if (maybe && typeof (maybe as Promise<void>).then === 'function') {
      await maybe;
    }
  } catch {
    /* Android'de dismissBrowser bazen undefined döner */
  }
}

async function completeGoogleSignIn(idToken: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return;
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
}

function waitForSignedInUser(timeoutMs = 8000): Promise<boolean> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return Promise.resolve(true);
  return new Promise((resolve) => {
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

function buildGoogleStartUrl(returnUrl: string): string {
  return `${buildApiUrl('/auth/google/start')}?return=${encodeURIComponent(returnUrl)}`;
}

async function runGoogleOAuth(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return;

  const returnUrl = getNativeOAuthRedirectUri();
  const googleUrl = buildGoogleStartUrl(returnUrl);

  if (__DEV__) {
    console.log('[Google] platform:', Platform.OS);
    console.log('[Google] return:', returnUrl);
    console.log('[Google] start:', googleUrl);
  }

  let capturedToken: string | null = null;
  let capturedError: string | null = null;
  let signInFromLink: Promise<void> | null = null;

  const processReturnUrl = (url: string) => {
    if (!url || !isMobileOAuthReturnUrl(url)) return;
    const { idToken, error } = parseOAuthReturnUrl(url);
    if (error) capturedError = error;
    if (idToken) capturedToken = idToken;
  };

  const onUrl = ({ url }: { url: string }) => {
    processReturnUrl(url);
    if (capturedToken && !signInFromLink) {
      signInFromLink = completeGoogleSignIn(capturedToken).catch((e: unknown) => {
        capturedError = e instanceof Error ? e.message : 'Google girişi başarısız';
      });
      void safeDismissBrowser();
    }
  };

  const linkSub = Linking.addEventListener('url', onUrl);

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
      preferEphemeralSession: false,
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

  // Android: deep link bazen session kapandıktan sonra gelir
  if (!capturedToken && !capturedError && !auth.currentUser) {
    await new Promise((r) => setTimeout(r, Platform.OS === 'android' ? 2000 : 500));
  }

  linkSub.remove();
  await safeDismissBrowser();

  if (signInFromLink) {
    await signInFromLink;
  }

  if (capturedError) {
    throw new Error(capturedError);
  }

  if (auth.currentUser) return;

  let idToken: string | undefined;

  if (result.type === 'success') {
    const parsed = parseOAuthReturnUrl(result.url);
    if (parsed.error) throw new Error(parsed.error);
    idToken = parsed.idToken;
  }

  if (!idToken && capturedToken) {
    idToken = capturedToken;
  }

  if (idToken) {
    await completeGoogleSignIn(idToken);
    return;
  }

  if (await waitForSignedInUser(6000)) return;

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google girişi iptal edildi');
  }

  throw new Error('Google girişi tamamlanamadı — tekrar deneyin');
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
