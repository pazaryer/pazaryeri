import Constants from 'expo-constants';
import { getCachedRemoteConfig } from '@/lib/remote-config';

export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}

function parseParts(v: string): number[] {
  return v
    .split('.')
    .map((p) => parseInt(p.replace(/[^0-9].*$/, ''), 10))
    .map((n) => (Number.isFinite(n) ? n : 0));
}

/** a < b → negative, a === b → 0, a > b → positive */
export function compareSemver(a: string, b: string): number {
  const pa = parseParts(a);
  const pb = parseParts(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function getForceUpdateState(): { required: boolean; message: string; storeUrl: string } {
  const cfg = getCachedRemoteConfig()['mobile.app'];
  const current = getAppVersion();
  const min = cfg?.minSupportedVersion ?? current;
  const required = Boolean(cfg?.forceUpdate) && compareSemver(current, min) < 0;
  return {
    required,
    message: cfg?.updateMessage ?? 'Yeni sürüm mevcut. Lütfen uygulamayı güncelleyin.',
    storeUrl:
      'https://play.google.com/store/apps/details?id=com.pazaryerim',
  };
}
