import { getAdMobConfig, resolveInterstitialUnitId } from './config';
import { getAdsModule, isAdMobSupported } from './native';

let loading = false;
let loaded = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let interstitial: any = null;
let unitIdCache: string | null = null;
const unsubscribers: Array<() => void> = [];

function cleanupInterstitial(): void {
  unsubscribers.forEach((u) => {
    try {
      u();
    } catch {
      /* ignore */
    }
  });
  unsubscribers.length = 0;
  interstitial = null;
  unitIdCache = null;
  loaded = false;
  loading = false;
}

function ensureInterstitial(unitId: string) {
  const ads = getAdsModule();
  if (!ads) return null;
  if (interstitial && unitIdCache === unitId) return interstitial;

  cleanupInterstitial();
  unitIdCache = unitId;
  interstitial = ads.InterstitialAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: false,
  });

  unsubscribers.push(
    interstitial.addAdEventListener(ads.AdEventType.LOADED, () => {
      loaded = true;
      loading = false;
    }),
  );
  unsubscribers.push(
    interstitial.addAdEventListener(ads.AdEventType.CLOSED, () => {
      loaded = false;
      loading = false;
      setTimeout(() => preloadInterstitial(), 300);
    }),
  );
  unsubscribers.push(
    interstitial.addAdEventListener(ads.AdEventType.ERROR, () => {
      loaded = false;
      loading = false;
      setTimeout(() => preloadInterstitial(), 2000);
    }),
  );

  return interstitial;
}

export function preloadInterstitial(): void {
  if (!isAdMobSupported()) return;
  try {
    const config = getAdMobConfig();
    if (!config.interstitial.enabled) return;
    const unitId = resolveInterstitialUnitId(config);
    if (!unitId || loading || loaded) return;
    const ad = ensureInterstitial(unitId);
    if (!ad) return;
    loading = true;
    ad.load();
  } catch {
    loading = false;
  }
}

export async function showInterstitialAd(): Promise<boolean> {
  if (!isAdMobSupported()) return false;
  try {
    const config = getAdMobConfig();
    if (!config.interstitial.enabled) return false;
    const unitId = resolveInterstitialUnitId(config);
    if (!unitId) return false;
    const ad = ensureInterstitial(unitId);
    if (!ad) return false;

    if (!loaded) {
      await new Promise<void>((resolve) => {
        const ads = getAdsModule();
        if (!ads || !interstitial) return resolve();
        const unsub = interstitial.addAdEventListener(ads.AdEventType.LOADED, () => {
          unsub();
          resolve();
        });
        if (!loading) {
          loading = true;
          interstitial.load();
        }
        setTimeout(() => {
          unsub();
          resolve();
        }, 8000);
      });
    }

    if (!loaded || !interstitial) {
      preloadInterstitial();
      return false;
    }
    await interstitial.show();
    loaded = false;
    return true;
  } catch {
    preloadInterstitial();
    return false;
  }
}

export async function maybeShowThirdSessionInterstitial(): Promise<void> {
  if (!isAdMobSupported()) return;
  try {
    const config = getAdMobConfig();
    if (!config.interstitial.enabled || !config.interstitial.thirdSessionEnabled) return;
    const { trackAppOpen } = await import('./session');
    const { showInterstitial } = await trackAppOpen();
    if (showInterstitial) await showInterstitialAd();
  } catch {
    /* ignore */
  }
}

/** Ekran geçişi reklamları devre dışı — yalnızca uygulama açılışında gösterilir */
export async function maybeShowNavigationInterstitial(): Promise<void> {
  return;
}

export async function maybeShowListingInterstitial(reason: 'second_listing' | 'delete_listing'): Promise<void> {
  if (!isAdMobSupported()) return;
  try {
    const config = getAdMobConfig();
    if (!config.interstitial.enabled) return;
    if (reason === 'second_listing' && !config.interstitial.afterSecondListingEnabled) return;
    if (reason === 'delete_listing' && !config.interstitial.afterDeleteListingEnabled) return;
    await new Promise((r) => setTimeout(r, 400));
    await showInterstitialAd();
  } catch {
    /* ignore */
  }
}

export async function maybeShowBoostInterstitial(): Promise<void> {
  if (!isAdMobSupported()) return;
  try {
    const config = getAdMobConfig();
    if (!config.interstitial.enabled) return;
    await new Promise((r) => setTimeout(r, 500));
    await showInterstitialAd();
  } catch {
    /* ignore */
  }
}
