import type { AdMobConfig } from "./mobile-admob";

const TEST_PUBLISHER = "3940256099942544";

/** Admin panelden yapılandırılmış mı — Render env kullanılmaz */
export function isAdMobProductionReady(config: AdMobConfig): boolean {
  const anyEnabled =
    config.banner.enabled || config.interstitial.enabled || config.rewarded.enabled;
  if (!anyEnabled) return true;
  if (config.testMode) return false;

  const ids = [
    config.banner.androidUnitId,
    config.banner.iosUnitId,
    config.interstitial.androidUnitId,
    config.interstitial.androidUnitId,
    config.rewarded.androidUnitId,
    config.rewarded.iosUnitId,
  ];

  return ids.every((id) => {
    const v = id?.trim() ?? "";
    return v.length > 0 && !v.includes(TEST_PUBLISHER);
  });
}
