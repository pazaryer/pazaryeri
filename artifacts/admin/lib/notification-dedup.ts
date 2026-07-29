const recent = new Map<string, number>();
const TTL_MS = 6000;

export function shouldShowInAppNotification(key: string): boolean {
  const now = Date.now();
  for (const [k, t] of recent) {
    if (now - t > TTL_MS) recent.delete(k);
  }
  const last = recent.get(key);
  if (last != null && now - last < TTL_MS) return false;
  recent.set(key, now);
  return true;
}

export function inAppNotificationKey(type: string, opts: { id?: string }): string {
  return opts.id ? `${type}:${opts.id}` : `${type}:${Date.now()}`;
}
