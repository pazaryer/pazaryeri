import { useCallback, useEffect } from 'react';
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
  return AuthSession.makeRedirectUri({ scheme: 'pazaryeri', path: 'auth' });
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
  await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}

function waitForSignedInUser(timeoutMs = 6000): Promise<boolean> {
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

/** Uygulama içinden API çağrısı — tarayıcıda site açılmaz */
async function fetchGoogleAuthUrl(returnUrl: string): Promise<string> {
  const endpoint = `${buildApiUrl('/auth/google/url')}?return=${encodeURIComponent(returnUrl)}`;
  const res = await fetch(endpoint);
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? 'Google bağlantısı kurulamadı');
  }
  return data.url;
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

/**
 * Doğrudan Google hesap seçici (accounts.google.com).
 * pazaryeri0.web.app veya onrender tarayıcıda görünmez.
 */
async function runGoogleOAuth(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return;

  const returnUrl = getNativeOAuthRedirectUri();
  const googleUrl = await fetchGoogleAuthUrl(returnUrl);

  if (__DEV__) {
    console.log('[Google] platform:', Platform.OS);
    console.log('[Google] return:', returnUrl);
    console.log('[Google] google:', googleUrl.slice(0, 80));
  }

  let linkSub: { remove: () => void } | null = null;
  let done = false;

  const handleUrl = (url: string) => {
    if (done) return;
    void finishFromUrl(url)
      .then((ok) => {
        if (ok) done = true;
      })
      .catch(() => {});
  };

  try {
    linkSub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    if (Platform.OS === 'android') {
      try {
        await WebBrowser.warmUpAsync();
      } catch {
        /* ignore */
      }
    }

    const result = await WebBrowser.openAuthSessionAsync(googleUrl, returnUrl, {
      preferEphemeralSession: false,
      showInRecents: false,
      createTask: false,
    });

    if (__DEV__) console.log('[Google] result:', result.type);

    if (!done && result.type === 'success') {
      const ok = await finishFromUrl(result.url);
      if (ok) done = true;
    }

    if (!done && !auth.currentUser) {
      await new Promise((r) => setTimeout(r, Platform.OS === 'android' ? 2000 : 800));
    }

    if (!done && result.type === 'success') {
      const ok = await finishFromUrl(result.url);
      if (ok) done = true;
    }

    if (auth.currentUser || (await waitForSignedInUser(4000))) return;

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
  if (Platform.OS === 'web') throw new Error('Web için /giris kullanın');
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
  return { request: ready, response: null, promptAsync: signIn, redirectUri, webClientId };
}
