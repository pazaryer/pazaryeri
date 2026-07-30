import { useEffect } from 'react';
import { AppState } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

/** Admin uygulaması — EAS OTA güncelleme kontrolü (Expo Go / dev modda atlanır) */
export function OtaUpdateHandler() {
  useEffect(() => {
    if (__DEV__ || Constants.appOwnership === 'expo') return;

    let cancelled = false;

    async function check() {
      try {
        if (!Updates.isEnabled) return;
        const result = await Updates.checkForUpdateAsync();
        if (cancelled || !result.isAvailable) return;
        await Updates.fetchUpdateAsync();
        if (!cancelled) await Updates.reloadAsync();
      } catch (err) {
        console.warn('[Admin OTA] Güncelleme kontrolü başarısız:', err);
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
