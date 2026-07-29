import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiFetch } from './api';
import { getDeviceId } from './device-id';
import { ANNOUNCEMENTS } from './categories';

export type MarqueeItem = { id: string; text: string };

let cached: { items: MarqueeItem[]; enabled: boolean; at: number } | null = null;
const TTL = 45_000;

export async function fetchMarquee(force = false): Promise<{ items: MarqueeItem[]; enabled: boolean }> {
  const now = Date.now();
  if (!force && cached && now - cached.at < TTL) {
    return { items: cached.items, enabled: cached.enabled };
  }
  try {
    const res = await apiFetch<{ items: MarqueeItem[]; enabled: boolean }>('/marquee');
    cached = { items: res.items ?? [], enabled: res.enabled ?? false, at: now };
    return { items: cached.items, enabled: cached.enabled };
  } catch {
    const fallback = ANNOUNCEMENTS.map((text, i) => ({ id: String(i), text }));
    return { items: fallback, enabled: true };
  }
}

export function buildMarqueeText(items: MarqueeItem[]): string {
  if (!items.length) return '';
  return items.map((i) => i.text).join('   ·   ') + '   ·   ';
}

export function useMarqueeText(): { text: string; enabled: boolean; loading: boolean } {
  const [text, setText] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarquee().then((r) => {
      setEnabled(r.enabled);
      setText(buildMarqueeText(r.items));
      setLoading(false);
    });
  }, []);

  return { text, enabled, loading };
}

/** Cihaz bazlı presence — her cihaz tek kimlik */
export async function pingPresence(): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    await apiFetch('/presence/ping', {
      method: 'POST',
      body: JSON.stringify({
        deviceId,
        platform: Platform.OS === 'web' ? 'web' : Platform.OS === 'ios' ? 'ios' : 'android',
        appVersion: Constants.expoConfig?.version ?? '1.0.0',
      }),
    });
  } catch {
    /* ignore */
  }
}
