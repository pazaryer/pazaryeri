import { useCallback, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { sitePath } from './config';
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
    /* ignore */
  }
}

async function completeGoogleSignIn(idToken: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return;
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
}

function waitForSignedInUser(timeoutMs = 5000): Promise<boolean> {
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

/** pazaryeri0.web.app — Render URL tarayıcıda görünmez */
function buildOAuthBridgeUrl(returnUrl: string): string {
  return `${sitePath('/oauth/start')}?return=${encodeURIComponent(returnUrl)}`;
}

async function finishFromUrl(url: string): Promise<boolean> {
  if (!url || !isMobileOAuthReturnUrl(url)) return false;
  const { idToken, error } = parseOAuthReturnUrl(url);
  if (error) throw new Error(error);
  if (!idToken) return false;
  await completeGoogleSignIn(idToken);
  await safeDismissBrowser();
  return true;
}

async function runGoogleOAuth(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return;

  const returnUrl = getNativeOAuthRedirectUri();
  const bridgeUrl = buildOAuthBridgeUrl(returnUrl);

  if (__DEV__) {
    console.log('[Google] platform:', Platform.OS);
    console.log('[Google] return:', returnUrl);
    console.log('[Google] bridge:', bridgeUrl);
  }

  let linkSub: { remove: () => void } | null = null;
  let finished = false;

  const tryFinish = async (url: string): Promise<boolean> => {
    if (finished || auth.currentUser) return true;
    const ok = await finishFromUrl(url);
    if (ok) finished = true;
    return ok;
  };

  try {
    linkSub = Linking.addEventListener('url', ({ url }) => {
      void tryFinish(url);
    });

    const initial = await Linking.getInitialURL();
    if (initial && (await tryFinish(initial))) return;

    if (Platform.OS === 'android') {
      try {
        await WebBrowser.warmUpAsync();
      } catch {
        /* ignore */
      }
    }

    const result = await WebBrowser.openAuthSessionAsync(bridgeUrl, returnUrl, {
      preferEphemeralSession: false,
      showInRecents: false,
      createTask: false,
    });

    if (__DEV__) console.log('[Google] result:', result.type);

    if (!finished && result.type === 'success') {
      await tryFinish(result.url);
    }

    if (!finished && !auth.currentUser) {
      await new Promise((r) => setTimeout(r, Platform.OS === 'android' ? 2500 : 1000));
    }

    if (!finished && auth.currentUser) finished = true;
    if (!finished) await waitForSignedInUser(4000);
    if (auth.currentUser) return;

    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Google girişi iptal edildi');
    }

    throw new Error('Google girişi tamamlanamadı — tekrar deneyin');
  } finally {
    linkSub?.remove();
    await safeDismissBrowser();
    if (Platform.OS === 'android') {
      try {
        await WebBrowser.coolDownAsync();
      } catch {
        /* ignore */
      }
    }
  }
}

/** Uygulama genelinde OAuth deep link yakala (login ekranı dışında da) */
export function useGoogleOAuthLinkHandler() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handle = ({ url }: { url: string }) => {
      if (!isMobileOAuthReturnUrl(url)) return;
      void finishFromUrl(url).catch(() => {});
    };

    const sub = Linking.addEventListener('url', handle);
    void Linking.getInitialURL().then((u) => {
      if (u) handle({ url: u });
    });
    return () => sub.remove();
  }, []);
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
