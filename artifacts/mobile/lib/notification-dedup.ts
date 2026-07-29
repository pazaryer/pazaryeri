const recent = new Map<string, number>();
const TTL_MS = 6000;

/** Aynı bildirimin kısa sürede birden fazla kez gösterilmesini engeller. */
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

export function inAppNotificationKey(
  type: string,
  opts: { id?: string; conversationId?: string; listingId?: string },
): string {
  if (opts.id) return `${type}:${opts.id}`;
  if (opts.conversationId) return `msg:${opts.conversationId}`;
  if (opts.listingId) return `${type}:${opts.listingId}`;
  return `${type}:${Date.now()}`;
}
