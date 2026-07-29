import * as Location from 'expo-location';
import { normalizeIl } from '@/lib/turkiye-iller';

export type ListingCoords = {
  latitude?: number;
  longitude?: number;
};

export function parseLocationParts(location: string): { city?: string; district?: string } {
  const parts = location.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { district: parts[0], city: parts[1] };
  }
  if (parts.length === 1) {
    return { city: parts[0], district: parts[0] };
  }
  return {};
}

/** Reverse geocode sonucundan il/ilçe metni üretir. */
export function formatGeocodedLocation(geo: Location.LocationGeocodedAddress | undefined): string {
  if (!geo) return '';
  const district = geo.district || geo.subregion;
  const city = geo.region || geo.city;
  return [district, city].filter(Boolean).join(', ');
}

/** İlan kaydı için normalize edilmiş şehir/ilçe. */
export function normalizeListingLocationParts(location: string): {
  city?: string;
  district?: string;
  location: string;
} {
  const parts = parseLocationParts(location);
  const city = parts.city ? normalizeIl(parts.city) ?? parts.city : undefined;
  let district = parts.district?.trim() || undefined;
  if (district && city) {
    const foldedDistrict = district.toLocaleLowerCase('tr-TR');
    const foldedCity = city.toLocaleLowerCase('tr-TR');
    if (foldedDistrict === foldedCity) district = undefined;
  }
  const loc =
    district && city ? `${district}, ${city}` : city ?? location.trim();
  return { city, district, location: loc };
}

export function formatListingLocation(item: {
  district?: string | null;
  city?: string | null;
  location?: string | null;
}): string {
  if (item.location?.trim()) return item.location.trim();
  return [item.district, item.city].filter(Boolean).join(', ');
}

export async function getDeviceCoords(): Promise<ListingCoords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  } catch {
    return null;
  }
}

/** Metin konumu veya cihaz GPS ile koordinat çöz */
export async function resolveListingCoords(
  locationText: string,
  saved?: ListingCoords,
): Promise<ListingCoords> {
  if (saved?.latitude != null && saved?.longitude != null) {
    return saved;
  }

  const query = locationText.trim();
  if (query) {
    try {
      const results = await Location.geocodeAsync(query);
      const hit = results[0];
      if (hit?.latitude != null && hit.longitude != null) {
        return { latitude: hit.latitude, longitude: hit.longitude };
      }
    } catch {
      /* geocode başarısız */
    }
  }

  const device = await getDeviceCoords();
  return device ?? {};
}
