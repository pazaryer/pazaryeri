import { calcDistance } from "./supabase-db";

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function filterByRadius<T extends { latitude?: number | null; longitude?: number | null }>(
  items: T[],
  userLat: number,
  userLon: number,
  radiusKm: number,
): T[] {
  return items.filter((item) => {
    if (item.latitude == null || item.longitude == null) return false;
    return haversineKm(userLat, userLon, item.latitude, item.longitude) <= radiusKm;
  });
}

export { calcDistance };
