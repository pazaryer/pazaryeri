import { GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult, type UserCredential } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

const RETURN_KEY = 'pazaryeri_oauth_return';

export function saveOAuthReturnUrl(returnUrl: string) {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(RETURN_KEY, returnUrl);
  }
}

export function takeOAuthReturnUrl(): string {
  if (typeof sessionStorage === 'undefined') return '';
  const url = sessionStorage.getItem(RETURN_KEY) ?? '';
  sessionStorage.removeItem(RETURN_KEY);
  return url;
}

export function peekOAuthReturnUrl(): string {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(RETURN_KEY) ?? '';
}

export async function startGoogleRedirect(returnUrl?: string) {
  if (returnUrl) saveOAuthReturnUrl(returnUrl);
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithRedirect(auth, provider);
}

/** Mobil köprü — Firebase popup ile doğrudan Google hesap seçici */
export async function signInWithGooglePopup(): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

export async function completeGoogleRedirect(): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();
  return getRedirectResult(auth);
}

/** Mobil köprü için Google OAuth id_token (Firebase getIdToken DEĞİL) */
export function extractGoogleIdTokenFromRedirect(result: UserCredential): string | null {
  const credential = GoogleAuthProvider.credentialFromResult(result);
  return credential?.idToken ?? null;
}

function openDeepLink(target: string) {
  if (typeof window === 'undefined') return;
  const anchor = document.createElement('a');
  anchor.href = target;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => anchor.remove(), 200);
}

export function redirectToAppWithToken(returnUrl: string, idToken: string) {
  const safeReturn = resolveNativeReturnUrl(returnUrl);
  const sep = safeReturn.includes('?') ? '&' : '?';
  const target = `${safeReturn}${sep}id_token=${encodeURIComponent(idToken)}`;

  if (typeof window !== 'undefined') {
    window.location.replace(target);
    window.setTimeout(() => {
      window.location.href = target;
    }, 300);
    return;
  }

  openDeepLink(target);
}

export function redirectToAppWithError(returnUrl: string, error: string) {
  const safeReturn = resolveNativeReturnUrl(returnUrl);
  const sep = safeReturn.includes('?') ? '&' : '?';
  const target = `${safeReturn}${sep}error=${encodeURIComponent(error)}`;
  openDeepLink(target);
}

function resolveNativeReturnUrl(returnUrl: string): string {
  if (!returnUrl) return 'pazaryeri://auth';
  if (returnUrl.startsWith('exp://')) return returnUrl;
  if (returnUrl.startsWith('pazaryeri://')) return returnUrl;
  if (/auth\.expo\.io/i.test(returnUrl)) return 'pazaryeri://auth';
  return returnUrl;
}
