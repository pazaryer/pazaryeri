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

export function redirectToAppWithToken(returnUrl: string, idToken: string) {
  const sep = returnUrl.includes('?') ? '&' : '?';
  window.location.href = `${returnUrl}${sep}id_token=${encodeURIComponent(idToken)}`;
}

export function redirectToAppWithError(returnUrl: string, error: string) {
  const sep = returnUrl.includes('?') ? '&' : '?';
  window.location.href = `${returnUrl}${sep}error=${encodeURIComponent(error)}`;
}
