import { DEFAULT_APP_CONFIG } from "./app-config-defaults";

export type AdMobUnitConfig = {
  enabled: boolean;
  androidAppId: string;
  iosAppId: string;
  androidUnitId: string;
  iosUnitId: string;
};

export type AdMobConfig = {
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

const DEFAULT_UNIT: AdMobUnitConfig = {
  enabled: false,
  androidAppId: "",
  iosAppId: "",
  androidUnitId: "",
  iosUnitId: "",
};

const DEFAULT_ADMOB = DEFAULT_APP_CONFIG["mobile.admob"] as AdMobConfig;

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v.trim() : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function mergeUnit(raw: Record<string, unknown> | undefined, fallback: AdMobUnitConfig): AdMobUnitConfig {
  return {
    enabled: bool(raw?.enabled, fallback.enabled),
    androidAppId: str(raw?.androidAppId, fallback.androidAppId),
    iosAppId: str(raw?.iosAppId, fallback.iosAppId),
    androidUnitId: str(raw?.androidUnitId, fallback.androidUnitId),
    iosUnitId: str(raw?.iosUnitId, fallback.iosUnitId),
  };
}

export function mergeAdMobConfig(config: Record<string, unknown>): AdMobConfig {
  const raw = (config["mobile.admob"] ?? {}) as Record<string, unknown>;
  const banner = mergeUnit(raw.banner as Record<string, unknown> | undefined, DEFAULT_ADMOB.banner);
  const interstitialRaw = raw.interstitial as Record<string, unknown> | undefined;
  const rewardedRaw = raw.rewarded as Record<string, unknown> | undefined;

  return {
    testMode: bool(raw.testMode, DEFAULT_ADMOB.testMode),
    banner,
    interstitial: {
      ...mergeUnit(interstitialRaw, DEFAULT_ADMOB.interstitial),
      thirdSessionEnabled: bool(interstitialRaw?.thirdSessionEnabled, DEFAULT_ADMOB.interstitial.thirdSessionEnabled),
      afterSecondListingEnabled: bool(
        interstitialRaw?.afterSecondListingEnabled,
        DEFAULT_ADMOB.interstitial.afterSecondListingEnabled,
      ),
      afterDeleteListingEnabled: bool(
        interstitialRaw?.afterDeleteListingEnabled,
        DEFAULT_ADMOB.interstitial.afterDeleteListingEnabled,
      ),
    },
    rewarded: {
      ...mergeUnit(rewardedRaw, DEFAULT_ADMOB.rewarded),
      boostHours: typeof rewardedRaw?.boostHours === "number" ? rewardedRaw.boostHours : DEFAULT_ADMOB.rewarded.boostHours,
    },
  };
}

export function admobToConfigKey(bundle: AdMobConfig): Record<string, unknown> {
  return { "mobile.admob": bundle };
}
