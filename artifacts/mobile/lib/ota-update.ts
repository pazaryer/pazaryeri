import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

let pendingReload = false;
let launchCheckDone = false;

export function isOtaSupported(): boolean {
  return (
    Platform.OS !== 'web' &&
    !__DEV__ &&
    Constants.appOwnership !== 'expo' &&
    Updates.isEnabled
  );
}

/** Uygulama açılışında splash ekranındayken — indir ve hemen uygula */
export async function applyOtaOnLaunch(): Promise<void> {
  if (!isOtaSupported() || launchCheckDone) return;
  launchCheckDone = true;

  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch {
    /* güncelleme yoksa veya ağ hatası — uygulama normal açılır */
  }
}

/** Ön plana gelince arka planda indir; kullanıcı çalışmaya devam eder */
export async function prefetchOtaOnForeground(): Promise<void> {
  if (!isOtaSupported()) return;

  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;
    await Updates.fetchUpdateAsync();
    pendingReload = true;
  } catch {
    /* ignore */
  }
}

/** İndirilen güncellemeyi uygulama arka plana geçince sessizce uygula */
export function attachOtaBackgroundReload(): () => void {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'background' && pendingReload) {
      pendingReload = false;
      void Updates.reloadAsync().catch(() => {});
    }
  });
  return () => sub.remove();
}
