import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

/** Uygulama açılışında ve ön plana gelince EAS OTA güncellemesini kontrol eder. */
export function OtaUpdateHandler() {
  useEffect(() => {
    if (Platform.OS === 'web' || __DEV__ || Constants.appOwnership === 'expo') return;

    let cancelled = false;

    async function check() {
      try {
        if (!Updates.isEnabled) return;
        const result = await Updates.checkForUpdateAsync();
        if (cancelled || !result.isAvailable) return;
        await Updates.fetchUpdateAsync();
        if (!cancelled) await Updates.reloadAsync();
      } catch (err) {
        console.warn('[OTA] Güncelleme kontrolü başarısız:', err);
      }
    }

    void check();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return null;
}
