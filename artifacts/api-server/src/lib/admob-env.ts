import type { AdMobConfig } from "./mobile-admob";

const TEST_PUBLISHER = "3940256099942544";

function unitIdReady(unitId: string | undefined): boolean {
  const v = unitId?.trim() ?? "";
  return v.length > 0 && !v.includes(TEST_PUBLISHER);
}

/** Admin panelden yapılandırılmış mı — Render env kullanılmaz */
export function isAdMobProductionReady(config: AdMobConfig): boolean {
  const anyEnabled =
    config.banner.enabled || config.interstitial.enabled || config.rewarded.enabled;
  if (!anyEnabled) return true;
  if (config.testMode) return false;

  const units = [config.banner, config.interstitial, config.rewarded];
  const androidOk = units
    .filter((u) => u.enabled)
    .every((u) => unitIdReady(u.androidUnitId));
  const iosConfigured = units.some((u) => u.enabled && (u.iosUnitId?.trim() ?? "").length > 0);
  const iosOk = !iosConfigured
    || units.filter((u) => u.enabled).every((u) => unitIdReady(u.iosUnitId));

  return androidOk && iosOk;
}
