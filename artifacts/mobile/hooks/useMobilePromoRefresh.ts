import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { fetchRemoteConfig } from '@/lib/remote-config';

/** Remote config promo alanlarını periyodik yeniler (~60 sn). */
export function useMobilePromoRefresh(): void {
  const [, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => {
      void fetchRemoteConfig(true).then(() => setTick((t) => t + 1));
    };
    const interval = setInterval(refresh, 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);
}
