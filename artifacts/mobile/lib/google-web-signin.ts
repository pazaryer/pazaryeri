import Constants from 'expo-constants';
import { GOOGLE_WEB_CLIENT_ID } from './google-client-id';

export function getGoogleWebClientId(): string {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (fromEnv && fromEnv.includes('.apps.googleusercontent.com')) {
    return fromEnv;
  }
  return GOOGLE_WEB_CLIENT_ID;
}

let scriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Web ortamı gerekli'));
  }
  if ((window as any).google?.accounts?.id) {
    return Promise.resolve();
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-gsi]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Google script yüklenemedi')));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleGsi = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google giriş scripti yüklenemedi'));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/** Google Identity Services ile id_token al (Firebase credential için) */
export async function requestGoogleIdToken(): Promise<string> {
  await loadGoogleIdentityScript();
  const google = (window as any).google;
  const clientId = getGoogleWebClientId();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (!settled) {
        settled = true;
        fn();
      }
    };

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential?: string }) => {
        if (response.credential) {
          finish(() => resolve(response.credential));
        } else {
          finish(() => reject(new Error('Google token alınamadı')));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
    });

    google.accounts.id.prompt((notification: {
      isNotDisplayed: () => boolean;
      isSkippedMoment: () => boolean;
      getNotDisplayedReason: () => string;
      getSkippedReason: () => string;
    }) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const reason =
          notification.getNotDisplayedReason?.() ??
          notification.getSkippedReason?.() ??
          'unknown';
        finish(() =>
          reject(
            new Error(
              reason === 'browser_not_supported'
                ? 'Tarayıcınız Google girişini desteklemiyor'
                : 'Google hesap seçici açılamadı. Lütfen e-posta ile giriş yapın.',
            ),
          ),
        );
      }
    });

    setTimeout(() => {
      finish(() => reject(new Error('Google giriş zaman aşımı — tekrar deneyin')));
    }, 120_000);
  });
}

export function renderGoogleSignInButton(
  elementId: string,
  onCredential: (idToken: string) => void,
  onError: (err: Error) => void,
): () => void {
  let cancelled = false;

  loadGoogleIdentityScript()
    .then(() => {
      if (cancelled) return;
      const el = document.getElementById(elementId);
      if (!el) {
        onError(new Error('Google buton alanı bulunamadı'));
        return;
      }
      const google = (window as any).google;
      const clientId = getGoogleWebClientId();

      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) onCredential(response.credential);
          else onError(new Error('Google token alınamadı'));
        },
        auto_select: false,
      });

      el.innerHTML = '';
      google.accounts.id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.min(400, el.offsetWidth || 400),
        locale: 'tr',
      });
    })
    .catch((e) => onError(e instanceof Error ? e : new Error(String(e))));

  return () => {
    cancelled = true;
  };
}
