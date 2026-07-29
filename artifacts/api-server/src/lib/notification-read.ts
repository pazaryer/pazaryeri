export function parseNotificationIsRead(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  const s = String(value).trim().toLowerCase();
  return s === "true" || s === "t" || s === "1";
}

/** DB'ye yazılacak tutarlı boolean değer (migration sonrası boolean kolon). */
export const NOTIFICATION_READ_TRUE = true;
export const NOTIFICATION_READ_FALSE = false;
