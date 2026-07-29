import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getAdsModule, isAdMobSupported } from './native';

let initializing = false;
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

export async function initAdMobSdk(): Promise<boolean> {
  if (!isAdMobSupported()) return false;
  if (sdkReady) return true;
  if (initializing) return false;

  const ads = getAdsModule();
  if (!ads) return false;

  initializing = true;
  try {
    await ads.default().initialize();
    sdkReady = true;
    notifyReady();
    const [{ preloadInterstitial }, { preloadRewarded }] = await Promise.all([
      import('./interstitial'),
      import('./rewarded'),
    ]);
    preloadInterstitial();
    preloadRewarded();
    return true;
  } catch {
    return false;
  } finally {
    initializing = false;
  }
}

export function useAdMobLifecycle(): void {
  useEffect(() => {
    if (!isAdMobSupported() || Platform.OS === 'web' || lifecycleStarted) return;
    lifecycleStarted = true;

    void initAdMobSdk().then(async (ok) => {
      if (!ok || !sdkReady || thirdSessionHandled || __DEV__) return;
      thirdSessionHandled = true;
      try {
        const { maybeShowThirdSessionInterstitial } = await import('./interstitial');
        await maybeShowThirdSessionInterstitial();
      } catch {
        /* ignore */
      }
    });
  }, []);
}

export { isAdMobSupported };
