import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

let initialized = false;
let sdkReady = false;
const readyListeners = new Set<() => void>();

function notifyReady(): void {
  readyListeners.forEach((cb) => cb());
}

export function subscribeAdMobReady(listener: () => void): () => void {
  readyListeners.add(listener);
  if (sdkReady) listener();
  return () => readyListeners.delete(listener);
}

export function useAdMobSdkReady(): boolean {
  const [ready, setReady] = useState(sdkReady);
  useEffect(() => subscribeAdMobReady(() => setReady(true)), []);
  return ready;
}

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
    sdkReady = true;
    notifyReady();
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
      if (!sdkReady) return;
      try {
        const { maybeShowThirdSessionInterstitial } = await import('./interstitial');
        await maybeShowThirdSessionInterstitial();
      } catch {
        /* interstitial hatası uygulamayı düşürmemeli */
      }
    });
  }, []);
}
