import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

let initialized = false;

function getAdsModule() {
  if (Platform.OS === 'web') return null;
  try {
    return require('react-native-google-mobile-ads');
  } catch {
    return null;
  }
}

export async function initAdMobSdk(): Promise<void> {
  if (Platform.OS === 'web' || initialized) return;
  const ads = getAdsModule();
  if (!ads) return;
  try {
    await ads.default().initialize();
    initialized = true;
    const { preloadInterstitial } = await import('./interstitial');
    preloadInterstitial();
  } catch {
    /* SDK yok veya dev build değil */
  }
}

export function useAdMobLifecycle(): void {
  const ran = useRef(false);
  useEffect(() => {
    if (Platform.OS === 'web' || ran.current) return;
    ran.current = true;
    void initAdMobSdk().then(async () => {
      const { maybeShowThirdSessionInterstitial } = await import('./interstitial');
      await maybeShowThirdSessionInterstitial();
    });
  }, []);
}
