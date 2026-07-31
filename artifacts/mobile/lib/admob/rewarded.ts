import { Platform } from 'react-native';
import { getAdMobConfig, resolveRewardedUnitId } from './config';
import { getAdsModule, isAdMobSupported } from './native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let preloadAd: any = null;
let unitIdCache: string | null = null;
let preloadLoading = false;
let preloadLoaded = false;
const preloadUnsubs: Array<() => void> = [];

function safeUnsub(unsubs: Array<() => void>): void {
  unsubs.forEach((u) => {
    try {
      u();
    } catch {
      /* ignore */
    }
  });
  unsubs.length = 0;
}

function cleanupPreload(): void {
  safeUnsub(preloadUnsubs);
  preloadAd = null;
  unitIdCache = null;
  preloadLoaded = false;
  preloadLoading = false;
}

function attachPreloadListeners(ads: ReturnType<typeof getAdsModule>, ad: { addAdEventListener: (...args: unknown[]) => () => void }): void {
  preloadUnsubs.push(
    ad.addAdEventListener(ads.RewardedAdEventType.LOADED, () => {
      preloadLoaded = true;
      preloadLoading = false;
    }),
  );
  preloadUnsubs.push(
    ad.addAdEventListener(ads.AdEventType.ERROR, () => {
      preloadLoaded = false;
      preloadLoading = false;
      setTimeout(() => preloadRewarded(), 2500);
    }),
  );
}

function ensurePreloadAd(unitId: string) {
  const ads = getAdsModule();
  if (!ads?.RewardedAd?.createForAdRequest) return null;
  if (preloadAd && unitIdCache === unitId) return preloadAd;

  cleanupPreload();
  unitIdCache = unitId;
  preloadAd = ads.RewardedAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: false,
  });
  if (typeof preloadAd?.addAdEventListener !== 'function') {
    preloadAd = null;
    return null;
  }
  attachPreloadListeners(ads, preloadAd);
  return preloadAd;
}

export function preloadRewarded(): void {
  if (!isAdMobSupported()) return;
  try {
    const config = getAdMobConfig();
    if (!config.rewarded.enabled) return;
    const unitId = resolveRewardedUnitId(config);
    if (!unitId || preloadLoading || preloadLoaded) return;
    const ad = ensurePreloadAd(unitId);
    if (!ad?.load) return;
    preloadLoading = true;
    ad.load();
  } catch {
    preloadLoading = false;
  }
}

function createShowAd(unitId: string) {
  const ads = getAdsModule();
  if (!ads?.RewardedAd?.createForAdRequest) return null;
  const ad = ads.RewardedAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: false,
  });
  if (typeof ad?.addAdEventListener !== 'function' || typeof ad?.load !== 'function') {
    return null;
  }
  return { ads, ad };
}

/** Her gösterim için ayrı instance — preload dinleyicileriyle çakışmaz */
export async function showRewardedAdForBoost(): Promise<boolean> {
  if (!isAdMobSupported()) return false;
  const config = getAdMobConfig();
  if (!config.rewarded.enabled || Platform.OS === 'web') return false;
  const unitId = resolveRewardedUnitId(config);
  if (!unitId) return false;

  const created = createShowAd(unitId);
  if (!created) return false;
  const { ads, ad } = created;

  return new Promise<boolean>((resolve) => {
    let earned = false;
    let settled = false;
    const sessionUnsubs: Array<() => void> = [];

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      safeUnsub(sessionUnsubs);
      preloadLoaded = false;
      preloadLoading = false;
      setTimeout(() => preloadRewarded(), 600);
      resolve(ok && earned);
    };

    const listen = (type: string, handler: () => void) => {
      try {
        sessionUnsubs.push(ad.addAdEventListener(type, handler));
      } catch {
        finish(false);
      }
    };

    listen(ads.RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    listen(ads.RewardedAdEventType.CLOSED, () => finish(earned));
    listen(ads.AdEventType.ERROR, () => finish(false));
    listen(ads.RewardedAdEventType.LOADED, () => {
      void ad.show().catch(() => finish(false));
    });

    try {
      ad.load();
    } catch {
      finish(false);
      return;
    }

    const timeout = setTimeout(() => finish(false), 15_000);
    sessionUnsubs.push(() => clearTimeout(timeout));
  });
}
