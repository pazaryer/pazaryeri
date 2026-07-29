import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { SITE_URL } from '@/lib/config';

/** https://site/listing/uuid veya pazaryeri://listing/uuid → uygulama içi rota */
export function resolveDeepLinkPath(url: string): string | null {
  if (!url?.trim()) return null;

  try {
    const parsed = Linking.parse(url);
    const path = (parsed.path ?? '').replace(/^\/+/, '');

    if (path.startsWith('listing/')) {
      const id = path.slice('listing/'.length).split('/')[0];
      if (id) return `/listing/${id}`;
    }
    if (path.startsWith('ilan/')) {
      const id = path.slice('ilan/'.length).split('/')[0];
      if (id) return `/listing/${id}`;
    }
    if (path === 'kesfet' || path.startsWith('kesfet/')) {
      const q = parsed.queryParams?.q;
      if (typeof q === 'string' && q.trim()) {
        return `/kesfet?q=${encodeURIComponent(q.trim())}`;
      }
      return '/kesfet';
    }

    const host = parsed.hostname ?? '';
    const isOurHost =
      host === 'pazaryeri0.web.app' ||
      host === 'pazaryeri0.firebaseapp.com' ||
      url.startsWith(SITE_URL);

    if (isOurHost && path) {
      if (path.startsWith('listing/')) {
        const id = path.slice('listing/'.length).split('/')[0];
        if (id) return `/listing/${id}`;
      }
      if (path.startsWith('ilan/')) {
        const id = path.slice('ilan/'.length).split('/')[0];
        if (id) return `/listing/${id}`;
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

export function useDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const navigate = (url: string | null) => {
      if (!url) return;
      const path = resolveDeepLinkPath(url);
      if (path) router.push(path as never);
    };

    void Linking.getInitialURL().then(navigate);

    const sub = Linking.addEventListener('url', ({ url }) => navigate(url));
    return () => sub.remove();
  }, [router]);
}
