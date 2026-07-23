import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, type UserCredential } from 'firebase/auth';
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
  await signInWithRedirect(auth, provider);
}

export async function completeGoogleRedirect(): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();
  return getRedirectResult(auth);
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
  const safeReturn = /auth\.expo\.io/i.test(returnUrl) ? 'pazaryeri://auth' : returnUrl;
  const sep = safeReturn.includes('?') ? '&' : '?';
  const target = `${safeReturn}${sep}id_token=${encodeURIComponent(idToken)}`;
  openDeepLink(target);
}

export function redirectToAppWithError(returnUrl: string, error: string) {
  const safeReturn = /auth\.expo\.io/i.test(returnUrl) ? 'pazaryeri://auth' : returnUrl;
  const sep = safeReturn.includes('?') ? '&' : '?';
  const target = `${safeReturn}${sep}error=${encodeURIComponent(error)}`;
  openDeepLink(target);
}
