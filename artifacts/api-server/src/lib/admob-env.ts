import type { AdMobConfig } from "./mobile-admob";

const PROD_APP_ANDROID = "ca-app-pub-8045800087063412~8727412358";
const PROD_APP_IOS = "ca-app-pub-8045800087063412~8727412358";

function env(key: string): string {
  return process.env[key]?.trim() ?? "";
}

const TEST_PUBLISHER = "3940256099942544";

function isTestAdId(id: string): boolean {
  return id.includes(TEST_PUBLISHER);
}

/** Render env veya admin panelden gelen boş unit ID'leri tamamlar */
export function applyAdMobEnvOverrides(config: AdMobConfig): AdMobConfig {
  const bannerAndroid = env("ADMOB_ANDROID_BANNER_UNIT_ID");
  const bannerIos = env("ADMOB_IOS_BANNER_UNIT_ID");
  const interstitialAndroid = env("ADMOB_ANDROID_INTERSTITIAL_UNIT_ID");
  const interstitialIos = env("ADMOB_IOS_INTERSTITIAL_UNIT_ID");
  const rewardedAndroid = env("ADMOB_ANDROID_REWARDED_UNIT_ID");
  const rewardedIos = env("ADMOB_IOS_REWARDED_UNIT_ID");
  const appAndroid = env("ADMOB_ANDROID_APP_ID") || PROD_APP_ANDROID;
  const appIos = env("ADMOB_IOS_APP_ID") || PROD_APP_IOS;
  const forceProd = env("ADMOB_FORCE_PRODUCTION") === "1";

  const patchUnit = (
    unit: AdMobConfig["banner"],
    androidUnit: string,
    iosUnit: string,
  ): AdMobConfig["banner"] => {
    let androidAppId = unit.androidAppId || appAndroid;
    let iosAppId = unit.iosAppId || appIos;
    let androidUnitId = unit.androidUnitId || androidUnit;
    let iosUnitId = unit.iosUnitId || iosUnit;

    if (forceProd) {
      if (isTestAdId(androidAppId)) androidAppId = appAndroid;
      if (isTestAdId(iosAppId)) iosAppId = appIos;
      if (androidUnit && isTestAdId(androidUnitId)) androidUnitId = androidUnit;
      if (iosUnit && isTestAdId(iosUnitId)) iosUnitId = iosUnit;
    }

    return {
      ...unit,
      androidAppId,
      iosAppId,
      androidUnitId,
      iosUnitId,
    };
  };

  const next: AdMobConfig = {
    ...config,
    testMode: forceProd ? false : config.testMode,
    banner: patchUnit(config.banner, bannerAndroid, bannerIos),
    interstitial: {
      ...patchUnit(config.interstitial, interstitialAndroid, interstitialIos),
      thirdSessionEnabled: config.interstitial.thirdSessionEnabled,
      afterSecondListingEnabled: config.interstitial.afterSecondListingEnabled,
      afterDeleteListingEnabled: config.interstitial.afterDeleteListingEnabled,
    },
    rewarded: {
      ...patchUnit(config.rewarded, rewardedAndroid, rewardedIos),
      boostHours: config.rewarded.boostHours,
    },
  };

  if (forceProd) {
    next.testMode = false;
  }

  return next;
}

export function isAdMobProductionReady(config: AdMobConfig): boolean {
  if (config.testMode) return false;
  const units = [
    config.banner.androidUnitId,
    config.interstitial.androidUnitId,
    config.rewarded.androidUnitId,
  ];
  return units.every((id) => id && !id.includes("3940256099942544"));
}
