import type { AdMobConfig } from "./mobile-admob";

const PROD_APP_ANDROID = "ca-app-pub-8045800087063412~8727412358";
const PROD_APP_IOS = "ca-app-pub-8045800087063412~8727412358";

function env(key: string): string {
  return process.env[key]?.trim() ?? "";
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
  ): AdMobConfig["banner"] => ({
    ...unit,
    androidAppId: unit.androidAppId || appAndroid,
    iosAppId: unit.iosAppId || appIos,
    androidUnitId: unit.androidUnitId || androidUnit,
    iosUnitId: unit.iosUnitId || iosUnit,
  });

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
