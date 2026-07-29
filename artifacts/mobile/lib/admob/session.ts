import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_DATE = 'pz_ad_session_date';
const KEY_COUNT = 'pz_ad_session_count';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Günlük uygulama açılış sayısını artırır; 3. açılışta true döner. */
export async function trackDailyAppOpen(): Promise<{ count: number; isThirdOpen: boolean }> {
  if (Platform.OS === 'web') return { count: 0, isThirdOpen: false };
  const today = todayKey();
  const storedDate = (await AsyncStorage.getItem(KEY_DATE)) ?? '';
  let count = storedDate === today ? Number(await AsyncStorage.getItem(KEY_COUNT)) || 0 : 0;
  count += 1;
  await AsyncStorage.multiSet([
    [KEY_DATE, today],
    [KEY_COUNT, String(count)],
  ]);
  return { count, isThirdOpen: count === 3 };
}
