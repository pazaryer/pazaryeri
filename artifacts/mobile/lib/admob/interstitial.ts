import { Platform } from 'react-native';
import { getAdMobConfig, resolveInterstitialUnitId } from './config';

let loading = false;
let loaded = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let interstitial: any = null;
let unitIdCache: string | null = null;

function getAdsModule() {
  if (Platform.OS === 'web') return null;
  try {
    return require('react-native-google-mobile-ads');
  } catch {
    return null;
  }
}

function ensureInterstitial(unitId: string) {
  const ads = getAdsModule();
  if (!ads) return null;
  if (interstitial && unitIdCache === unitId) return interstitial;
  unitIdCache = unitId;
  loaded = false;
  interstitial = ads.InterstitialAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: false,
  });
  interstitial.addAdEventListener(ads.AdEventType.LOADED, () => {
    loaded = true;
    loading = false;
  });
  interstitial.addAdEventListener(ads.AdEventType.CLOSED, () => {
    loaded = false;
    preloadInterstitial();
  });
  interstitial.addAdEventListener(ads.AdEventType.ERROR, () => {
    loaded = false;
    loading = false;
  });
  return interstitial;
}

export function preloadInterstitial(): void {
  const config = getAdMobConfig();
  if (!config.interstitial.enabled || Platform.OS === 'web') return;
  const unitId = resolveInterstitialUnitId(config);
  if (!unitId || loading || loaded) return;
  const ad = ensureInterstitial(unitId);
  if (!ad) return;
  loading = true;
  ad.load();
}

export async function showInterstitialAd(): Promise<boolean> {
  const config = getAdMobConfig();
  if (!config.interstitial.enabled || Platform.OS === 'web') return false;
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
      }, 4000);
    });
  }
  if (!loaded || !interstitial) return false;
  try {
    await interstitial.show();
    loaded = false;
    return true;
  } catch {
    return false;
  }
}

export async function maybeShowThirdSessionInterstitial(): Promise<void> {
  const config = getAdMobConfig();
  if (!config.interstitial.enabled || !config.interstitial.thirdSessionEnabled) return;
  const { trackDailyAppOpen } = await import('./session');
  const { isThirdOpen } = await trackDailyAppOpen();
  if (isThirdOpen) await showInterstitialAd();
}

export async function maybeShowListingInterstitial(reason: 'second_listing' | 'delete_listing'): Promise<void> {
  const config = getAdMobConfig();
  if (!config.interstitial.enabled) return;
  if (reason === 'second_listing' && !config.interstitial.afterSecondListingEnabled) return;
  if (reason === 'delete_listing' && !config.interstitial.afterDeleteListingEnabled) return;
  await showInterstitialAd();
}
