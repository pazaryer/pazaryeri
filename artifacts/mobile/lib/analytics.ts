import { Platform } from 'react-native';
import type { Analytics } from 'firebase/analytics';
import { FIREBASE_WEB_CONFIG } from './firebase.config';

let webAnalytics: Analytics | null = null;
let initPromise: Promise<void> | null = null;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function gtagPageView(path: string, title?: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? path,
    page_location: `${window.location.origin}${path}`,
  });
}

async function initWebAnalytics(): Promise<void> {
  if (Platform.OS !== 'web') return;

  try {
    const { getApps } = await import('firebase/app');
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    const apps = getApps();
    if (!apps.length) return;

    const supported = await isSupported();
    if (supported) {
      webAnalytics = getAnalytics(apps[0]!);
    }
  } catch {
    /* Firebase Analytics web SDK kullanılamıyor */
  }
}

export function initAnalytics(): Promise<void> {
  if (!initPromise) {
    initPromise = initWebAnalytics();
  }
  return initPromise;
}

export function logScreenView(path: string, title?: string): void {
  const screen = path || '/';

  void initAnalytics().then(async () => {
    if (webAnalytics) {
      try {
        const { logEvent } = await import('firebase/analytics');
        await logEvent(webAnalytics, 'screen_view' as never, {
          firebase_screen: screen,
          firebase_screen_class: title ?? 'Pazaryeri',
        } as never);
      } catch {
        /* ignore */
      }
    }
  });

  gtagPageView(screen, title);
}

export function logAnalyticsEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): void {
  void initAnalytics().then(async () => {
    if (webAnalytics) {
      try {
        const { logEvent } = await import('firebase/analytics');
        await logEvent(webAnalytics, name, params);
      } catch {
        /* ignore */
      }
    }
  });

  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params ?? {});
  }
}

export function getMeasurementId(): string {
  return FIREBASE_WEB_CONFIG.measurementId;
}
