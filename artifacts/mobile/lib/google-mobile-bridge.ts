import { GoogleAuthProvider, getRedirectResult, signInWithRedirect } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import { redirectToAppWithError, redirectToAppWithToken, saveOAuthReturnUrl } from './google-web-auth';

const STARTED_KEY = 'pz_mobile_oauth_started';

/**
 * Mobil Expo Go köprüsü — Firebase Google redirect (PKCE origin_mismatch önlenir).
 */
export async function runMobileFirebaseBridge(appReturn: string): Promise<void> {
  saveOAuthReturnUrl(appReturn);
  const auth = getFirebaseAuth();

  const result = await getRedirectResult(auth);
  if (result?.user) {
    sessionStorage.removeItem(STARTED_KEY);
    const idToken = await result.user.getIdToken();
    redirectToAppWithToken(appReturn, idToken);
    return;
  }

  if (sessionStorage.getItem(STARTED_KEY)) {
    sessionStorage.removeItem(STARTED_KEY);
    redirectToAppWithError(appReturn, 'Google girişi tamamlanamadı. Lütfen tekrar deneyin.');
    return;
  }

  sessionStorage.setItem(STARTED_KEY, '1');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithRedirect(auth, provider);
}
