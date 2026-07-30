import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_APP_OPEN = 'pz_ad_app_open_count';
const KEY_LAST_SHOWN = 'pz_ad_last_interstitial_ms';
const KEY_DAILY_COUNT = 'pz_ad_interstitial_daily_count';
const KEY_DAILY_DATE = 'pz_ad_interstitial_daily_date';

const MIN_GAP_MS = 90 * 1000;
const MAX_PER_DAY = 12;
const APP_OPEN_INTERVAL = 3;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getDailyCount(): Promise<number> {
  const today = todayKey();
  const storedDate = (await AsyncStorage.getItem(KEY_DAILY_DATE)) ?? '';
  if (storedDate !== today) return 0;
  return Number(await AsyncStorage.getItem(KEY_DAILY_COUNT)) || 0;
}

export async function canShowInterstitialNow(bypassCooldown = false): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const now = Date.now();
  if (!bypassCooldown) {
    const lastShown = Number(await AsyncStorage.getItem(KEY_LAST_SHOWN)) || 0;
    if (lastShown > 0 && now - lastShown < MIN_GAP_MS) return false;
  }

  const dailyCount = await getDailyCount();
  return dailyCount < MAX_PER_DAY;
}

export async function recordInterstitialShown(): Promise<void> {
  if (Platform.OS === 'web') return;
  const today = todayKey();
  const dailyCount = await getDailyCount();
  await AsyncStorage.multiSet([
    [KEY_LAST_SHOWN, String(Date.now())],
    [KEY_DAILY_DATE, today],
    [KEY_DAILY_COUNT, String(dailyCount + 1)],
  ]);
}

/** Her 3. uygulama açılışında bir geçiş reklamı */
export async function trackAppOpen(): Promise<{ count: number; showInterstitial: boolean }> {
  if (Platform.OS === 'web') return { count: 0, showInterstitial: false };
  let count = Number(await AsyncStorage.getItem(KEY_APP_OPEN)) || 0;
  count += 1;
  await AsyncStorage.setItem(KEY_APP_OPEN, String(count));

  const onThirdOpen = count > 0 && count % APP_OPEN_INTERVAL === 0;
  const allowed = onThirdOpen && (await canShowInterstitialNow(false));
  return { count, showInterstitial: allowed };
}

export async function shouldShowListingInterstitial(sellerListingCount: number): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (sellerListingCount < 2) return false;
  return canShowInterstitialNow(false);
}

export async function shouldShowBoostInterstitial(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  return canShowInterstitialNow(true);
}
