import { Platform } from 'react-native';
import Constants from 'expo-constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdsModule = any;

let cachedModule: AdsModule | null | undefined;

/** Expo Go ve web'de native AdMob yok — yüklemek çökertir. */
export function isAdMobSupported(): boolean {
  if (Platform.OS === 'web') return false;
  if (Constants.appOwnership === 'expo') return false;
  return getAdsModule() !== null;
}

export function getAdsModule(): AdsModule | null {
  if (Platform.OS === 'web') return null;
  if (!isExpoGo() && cachedModule !== undefined) return cachedModule;
  if (isExpoGo()) return null;
  try {
    cachedModule = require('react-native-google-mobile-ads');
  } catch {
    cachedModule = null;
  }
  return cachedModule ?? null;
}

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}
