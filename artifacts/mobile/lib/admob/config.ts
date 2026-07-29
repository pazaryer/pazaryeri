import { Platform } from 'react-native';
import { useRemoteConfigVersion, getCachedRemoteConfig } from '@/lib/remote-config';

export type AdMobUnitConfig = {
  enabled: boolean;
  androidAppId: string;
  iosAppId: string;
  androidUnitId: string;
  iosUnitId: string;
};

export type AdMobRemoteConfig = {
  testMode: boolean;
  banner: AdMobUnitConfig;
  interstitial: AdMobUnitConfig & {
    thirdSessionEnabled: boolean;
    afterSecondListingEnabled: boolean;
    afterDeleteListingEnabled: boolean;
  };
  rewarded: AdMobUnitConfig & {
    boostHours: number;
  };
};

const EMPTY_UNIT: AdMobUnitConfig = {
  enabled: false,
  androidAppId: '',
  iosAppId: '',
  androidUnitId: '',
  iosUnitId: '',
};

const DEFAULT_ADMOB: AdMobRemoteConfig = {
  testMode: false,
  banner: { ...EMPTY_UNIT },
  interstitial: {
    ...EMPTY_UNIT,
    thirdSessionEnabled: true,
    afterSecondListingEnabled: true,
    afterDeleteListingEnabled: true,
  },
  rewarded: { ...EMPTY_UNIT, boostHours: 2 },
};

function mergeUnit(raw: Partial<AdMobUnitConfig> | undefined, fallback: AdMobUnitConfig): AdMobUnitConfig {
  return {
    enabled: raw?.enabled ?? fallback.enabled,
    androidAppId: raw?.androidAppId?.trim() ?? fallback.androidAppId,
    iosAppId: raw?.iosAppId?.trim() ?? fallback.iosAppId,
    androidUnitId: raw?.androidUnitId?.trim() ?? fallback.androidUnitId,
    iosUnitId: raw?.iosUnitId?.trim() ?? fallback.iosUnitId,
  };
}

export function getAdMobConfig(): AdMobRemoteConfig {
  const raw = getCachedRemoteConfig()['mobile.admob'] as Partial<AdMobRemoteConfig> | undefined;
  if (!raw) return DEFAULT_ADMOB;
  return {
    testMode: raw.testMode ?? DEFAULT_ADMOB.testMode,
    banner: mergeUnit(raw.banner, DEFAULT_ADMOB.banner),
    interstitial: {
      ...mergeUnit(raw.interstitial, DEFAULT_ADMOB.interstitial),
      thirdSessionEnabled: raw.interstitial?.thirdSessionEnabled ?? DEFAULT_ADMOB.interstitial.thirdSessionEnabled,
      afterSecondListingEnabled:
        raw.interstitial?.afterSecondListingEnabled ?? DEFAULT_ADMOB.interstitial.afterSecondListingEnabled,
      afterDeleteListingEnabled:
        raw.interstitial?.afterDeleteListingEnabled ?? DEFAULT_ADMOB.interstitial.afterDeleteListingEnabled,
    },
    rewarded: {
      ...mergeUnit(raw.rewarded, DEFAULT_ADMOB.rewarded),
      boostHours: raw.rewarded?.boostHours ?? DEFAULT_ADMOB.rewarded.boostHours,
    },
  };
}

export function useAdMobConfig(): AdMobRemoteConfig {
  useRemoteConfigVersion();
  return getAdMobConfig();
}

function resolveUnitId(
  config: AdMobRemoteConfig,
  unit: AdMobUnitConfig,
): string | null {
  if (Platform.OS === 'web' || !unit.enabled || config.testMode) return null;
  const id = Platform.OS === 'android' ? unit.androidUnitId : unit.iosUnitId;
  return id?.trim() || null;
}

export function resolveBannerUnitId(config: AdMobRemoteConfig): string | null {
  return resolveUnitId(config, config.banner);
}

export function resolveInterstitialUnitId(config: AdMobRemoteConfig): string | null {
  return resolveUnitId(config, config.interstitial);
}

export function resolveRewardedUnitId(config: AdMobRemoteConfig): string | null {
  return resolveUnitId(config, config.rewarded);
}

export const ADMOB_BANNER_HEIGHT = 50;

export { bannerHeightForWidth, resolveBannerWidth } from '@/lib/banner-layout';
