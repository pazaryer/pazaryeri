import { getGoogleWebClientId } from './google-web-signin';

/** Google Console → Authorized redirect URIs listesinde olmalı */
export const MOBILE_OAUTH_REDIRECT_URI = 'https://pazaryeri0.web.app/oauth/mobile';

const RETURN_KEY = 'pz_mobile_oauth_return';
const NONCE_KEY = 'pz_mobile_oauth_nonce';

export function saveMobileOAuthReturn(returnUrl: string) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(RETURN_KEY, returnUrl);
}

export function getMobileOAuthReturn(): string {
  if (typeof sessionStorage === 'undefined') return 'pazaryeri://auth';
  return sessionStorage.getItem(RETURN_KEY) ?? 'pazaryeri://auth';
}

export function startMobileGoogleOAuth() {
  if (typeof window === 'undefined') return;

  const nonce =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  sessionStorage.setItem(NONCE_KEY, nonce);

  const params = new URLSearchParams({
    client_id: getGoogleWebClientId(),
    redirect_uri: MOBILE_OAUTH_REDIRECT_URI,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    prompt: 'select_account',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function parseOAuthHash(): { idToken: string | null; error: string | null } {
  if (typeof window === 'undefined') return { idToken: null, error: null };

  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return { idToken: null, error: null };

  const params = new URLSearchParams(hash);
  const error = params.get('error_description') ?? params.get('error');
  const idToken = params.get('id_token');

  return { idToken, error };
}
