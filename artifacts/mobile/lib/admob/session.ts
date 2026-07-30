import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_APP_OPEN = 'pz_ad_app_open_count';
const KEY_LISTING_PUBLISH = 'pz_ad_listing_publish_count';

/** Her 3. uygulama açılışında bir geçiş reklamı (günlük sıfırlanmaz) */
export async function trackAppOpen(): Promise<{ count: number; showInterstitial: boolean }> {
  if (Platform.OS === 'web') return { count: 0, showInterstitial: false };
  let count = Number(await AsyncStorage.getItem(KEY_APP_OPEN)) || 0;
  count += 1;
  await AsyncStorage.setItem(KEY_APP_OPEN, String(count));
  return { count, showInterstitial: count > 0 && count % 3 === 0 };
}

/** @deprecated Ekran geçişi reklamları kapatıldı — kullanıcı deneyimi için yalnızca uygulama açılışı kullanılır */
export async function trackNavigationTransition(): Promise<boolean> {
  return false;
}

/** Yayınlanan ilan sayısı (2. ve sonrası için reklam) */
export async function trackListingPublished(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  let count = Number(await AsyncStorage.getItem(KEY_LISTING_PUBLISH)) || 0;
  count += 1;
  await AsyncStorage.setItem(KEY_LISTING_PUBLISH, String(count));
  return count >= 2;
}
