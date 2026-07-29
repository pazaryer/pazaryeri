import { Platform } from 'react-native';
import { getAdMobConfig, resolveRewardedUnitId } from './config';

function getAdsModule() {
  if (Platform.OS === 'web') return null;
  try {
    return require('react-native-google-mobile-ads');
  } catch {
    return null;
  }
}

export async function showRewardedAdForBoost(): Promise<boolean> {
  const config = getAdMobConfig();
  if (!config.rewarded.enabled || Platform.OS === 'web') return false;
  const unitId = resolveRewardedUnitId(config);
  if (!unitId) return false;

  const ads = getAdsModule();
  if (!ads) return false;

  return new Promise<boolean>((resolve) => {
    const rewarded = ads.RewardedAd.createForAdRequest(unitId);
    let earned = false;
    let settled = false;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok && earned);
    };

    const unsubLoaded = rewarded.addAdEventListener(ads.RewardedAdEventType.LOADED, () => {
      void rewarded.show().catch(() => finish(false));
    });

    const unsubEarned = rewarded.addAdEventListener(ads.RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });

    const unsubClosed = rewarded.addAdEventListener(ads.RewardedAdEventType.CLOSED, () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
      finish(earned);
    });

    const unsubError = rewarded.addAdEventListener(ads.AdEventType.ERROR, () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
      finish(false);
    });

    rewarded.load();
    setTimeout(() => finish(false), 30000);
  });
}
