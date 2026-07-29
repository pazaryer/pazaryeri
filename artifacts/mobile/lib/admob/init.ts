import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

let initializing = false;
let initialized = false;
let sdkReady = false;
let lifecycleStarted = false;
let thirdSessionHandled = false;
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

export async function initAdMobSdk(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (sdkReady) return true;
  if (initializing) return false;

  const ads = getAdsModule();
  if (!ads) return false;

  initializing = true;
  try {
    await ads.default().initialize();
    initialized = true;
    sdkReady = true;
    notifyReady();
    const { preloadInterstitial } = await import('./interstitial');
    preloadInterstitial();
    return true;
  } catch {
    /* Expo Go / hot reload — SDK zaten init veya native modül yok */
    if (initialized) {
      sdkReady = true;
      notifyReady();
      return true;
    }
    return false;
  } finally {
    initializing = false;
  }
}

export function useAdMobLifecycle(): void {
  useEffect(() => {
    if (Platform.OS === 'web' || lifecycleStarted) return;
    lifecycleStarted = true;

    void initAdMobSdk().then(async (ok) => {
      if (!ok || !sdkReady || thirdSessionHandled) return;
      if (__DEV__) return;

      thirdSessionHandled = true;
      try {
        const { maybeShowThirdSessionInterstitial } = await import('./interstitial');
        await maybeShowThirdSessionInterstitial();
      } catch {
        /* interstitial hatası uygulamayı düşürmemeli */
      }
    });
  }, []);
}
