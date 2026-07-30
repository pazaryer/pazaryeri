import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { logScreenView } from '@/lib/analytics';

/** Expo Router sayfa değişimlerini Firebase / GA4'e bildirir */
export function AnalyticsScreenTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = pathname || '/';
    if (lastPath.current === path) return;
    lastPath.current = path;
    logScreenView(path);
  }, [pathname]);

  return null;
}
