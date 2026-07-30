import { useEffect } from 'react';
import { attachOtaBackgroundReload, prefetchOtaOnForeground } from '@/lib/ota-update';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';

/** Ön plana gelince OTA indir; arka plana geçince sessizce uygula */
export function OtaUpdateHandler() {
  useEffect(() => {
    if (Platform.OS === 'web' || __DEV__ || Constants.appOwnership === 'expo') return;

    const detachReload = attachOtaBackgroundReload();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void prefetchOtaOnForeground();
    });

    return () => {
      detachReload();
      sub.remove();
    };
  }, []);

  return null;
}
