import type { ListingSummary } from '@/lib/hooks';

export function formatListingLocation(item: ListingSummary): string {
  const place = [item.district, item.city].filter(Boolean).join(', ');
  if (item.distance) {
    return place ? `${item.distance} · ${place}` : item.distance;
  }
  if (place) return place;
  if (item.location) return item.location;
  return 'Konum yok';
}
