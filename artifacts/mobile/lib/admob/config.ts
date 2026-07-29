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

const TEST_IDS = {
  android: {
    app: 'ca-app-pub-3940256099942544~3347511713',
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    app: 'ca-app-pub-3940256099942544~1458002511',
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
};

const DEFAULT_ADMOB: AdMobRemoteConfig = {
  testMode: true,
  banner: {
    enabled: false,
    androidAppId: TEST_IDS.android.app,
    iosAppId: TEST_IDS.ios.app,
    androidUnitId: TEST_IDS.android.banner,
    iosUnitId: TEST_IDS.ios.banner,
  },
  interstitial: {
    enabled: false,
    androidAppId: TEST_IDS.android.app,
    iosAppId: TEST_IDS.ios.app,
    androidUnitId: TEST_IDS.android.interstitial,
    iosUnitId: TEST_IDS.ios.interstitial,
    thirdSessionEnabled: true,
    afterSecondListingEnabled: true,
    afterDeleteListingEnabled: true,
  },
  rewarded: {
    enabled: false,
    androidAppId: TEST_IDS.android.app,
    iosAppId: TEST_IDS.ios.app,
    androidUnitId: TEST_IDS.android.rewarded,
    iosUnitId: TEST_IDS.ios.rewarded,
    boostHours: 2,
  },
};

function mergeUnit(raw: Partial<AdMobUnitConfig> | undefined, fallback: AdMobUnitConfig): AdMobUnitConfig {
  return {
    enabled: raw?.enabled ?? fallback.enabled,
    androidAppId: raw?.androidAppId?.trim() || fallback.androidAppId,
    iosAppId: raw?.iosAppId?.trim() || fallback.iosAppId,
    androidUnitId: raw?.androidUnitId?.trim() || fallback.androidUnitId,
    iosUnitId: raw?.iosUnitId?.trim() || fallback.iosUnitId,
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

export function resolveBannerUnitId(config: AdMobRemoteConfig): string | null {
  if (Platform.OS === 'web') return null;
  if (config.testMode) {
    return Platform.OS === 'android' ? TEST_IDS.android.banner : TEST_IDS.ios.banner;
  }
  const id = Platform.OS === 'android' ? config.banner.androidUnitId : config.banner.iosUnitId;
  return id?.trim() || null;
}

export function resolveInterstitialUnitId(config: AdMobRemoteConfig): string | null {
  if (Platform.OS === 'web') return null;
  if (config.testMode) {
    return Platform.OS === 'android' ? TEST_IDS.android.interstitial : TEST_IDS.ios.interstitial;
  }
  const id = Platform.OS === 'android' ? config.interstitial.androidUnitId : config.interstitial.iosUnitId;
  return id?.trim() || null;
}

export function resolveRewardedUnitId(config: AdMobRemoteConfig): string | null {
  if (Platform.OS === 'web') return null;
  if (config.testMode) {
    return Platform.OS === 'android' ? TEST_IDS.android.rewarded : TEST_IDS.ios.rewarded;
  }
  const id = Platform.OS === 'android' ? config.rewarded.androidUnitId : config.rewarded.iosUnitId;
  return id?.trim() || null;
}

export const ADMOB_BANNER_HEIGHT = 50;
