import { Platform } from 'react-native';
import { getAdMobConfig, resolveRewardedUnitId } from './config';
import { getAdsModule, isAdMobSupported } from './native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let rewarded: any = null;
let unitIdCache: string | null = null;
let loading = false;
let loaded = false;
const unsubscribers: Array<() => void> = [];

function cleanupRewarded(): void {
  unsubscribers.forEach((u) => {
    try {
      u();
    } catch {
      /* ignore */
    }
  });
  unsubscribers.length = 0;
  rewarded = null;
  unitIdCache = null;
  loaded = false;
  loading = false;
}

function ensureRewarded(unitId: string) {
  const ads = getAdsModule();
  if (!ads) return null;
  if (rewarded && unitIdCache === unitId) return rewarded;

  cleanupRewarded();
  unitIdCache = unitId;
  rewarded = ads.RewardedAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: false,
  });

  unsubscribers.push(
    rewarded.addAdEventListener(ads.RewardedAdEventType.LOADED, () => {
      loaded = true;
      loading = false;
    }),
  );
  unsubscribers.push(
    rewarded.addAdEventListener(ads.AdEventType.ERROR, () => {
      loaded = false;
      loading = false;
      setTimeout(() => preloadRewarded(), 2000);
    }),
  );
  unsubscribers.push(
    rewarded.addAdEventListener(ads.RewardedAdEventType.CLOSED, () => {
      loaded = false;
      loading = false;
      setTimeout(() => preloadRewarded(), 300);
    }),
  );

  return rewarded;
}

export function preloadRewarded(): void {
  if (!isAdMobSupported()) return;
  try {
    const config = getAdMobConfig();
    if (!config.rewarded.enabled) return;
    const unitId = resolveRewardedUnitId(config);
    if (!unitId || loading || loaded) return;
    const ad = ensureRewarded(unitId);
    if (!ad) return;
    loading = true;
    ad.load();
  } catch {
    loading = false;
  }
}

export async function showRewardedAdForBoost(): Promise<boolean> {
  if (!isAdMobSupported()) return false;
  const config = getAdMobConfig();
  if (!config.rewarded.enabled || Platform.OS === 'web') return false;
  const unitId = resolveRewardedUnitId(config);
  if (!unitId) return false;

  const ads = getAdsModule();
  if (!ads) return false;

  const ad = ensureRewarded(unitId);
  if (!ad) return false;

  return new Promise<boolean>((resolve) => {
    let earned = false;
    let settled = false;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok && earned);
    };

    const onLoaded = () => {
      void ad.show().catch(() => finish(false));
    };

    if (loaded) {
      onLoaded();
    } else {
      const unsub = ad.addAdEventListener(ads.RewardedAdEventType.LOADED, () => {
        unsub();
        onLoaded();
      });
      if (!loading) {
        loading = true;
        ad.load();
      }
      setTimeout(() => {
        unsub();
        finish(false);
      }, 8000);
    }

    const unsubEarned = ad.addAdEventListener(ads.RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });

    const unsubClosed = ad.addAdEventListener(ads.RewardedAdEventType.CLOSED, () => {
      unsubEarned();
      unsubClosed();
      unsubErr();
      finish(earned);
    });

    const unsubErr = ad.addAdEventListener(ads.AdEventType.ERROR, () => {
      unsubEarned();
      unsubClosed();
      unsubErr();
      preloadRewarded();
      finish(false);
    });
  });
}
