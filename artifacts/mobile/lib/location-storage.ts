import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocationFilterValue } from '@/components/LocationFilterBar';
import { normalizeIl } from '@/lib/turkiye-iller';

const STORAGE_KEY = 'pz_location_v1';

/** Eski ilçe/mahalle veya boş alanları temizler; yarım kayıtlı filtreleri düzeltir. */
export function sanitizeLocationFilter(v: LocationFilterValue): LocationFilterValue {
  const radiusKm = v.radiusKm && v.radiusKm > 0 ? v.radiusKm : undefined;
  if (radiusKm) {
    return { radiusKm };
  }

  const cityRaw = v.city?.trim();
  const city = cityRaw ? normalizeIl(cityRaw) ?? cityRaw : undefined;
  if (!city) {
    return {};
  }

  const district = v.district?.trim() || undefined;
  const neighborhood = district && v.neighborhood?.trim() ? v.neighborhood.trim() : undefined;

  const out: LocationFilterValue = { city };
  if (district) out.district = district;
  if (neighborhood) out.neighborhood = neighborhood;
  return out;
}

export function formatLocationLabel(v: LocationFilterValue): string {
  if (v.neighborhood && v.district && v.city) return `${v.neighborhood}, ${v.district}, ${v.city}`;
  if (v.district && v.city) return `${v.district}, ${v.city}`;
  if (v.city) return v.city;
  if (v.radiusKm) return `${v.radiusKm} km yakınında`;
  return 'Türkiye';
}

export function hasActiveLocationFilter(v: LocationFilterValue): boolean {
  return !!(v.radiusKm || v.city || v.district || v.neighborhood);
}

/** Metin alanlarından filtre oluşturur; şehir değişince eski ilçe/mahalle taşınmaz. */
export function buildLocationFilterFromInputs(
  committed: LocationFilterValue,
  inputs: { cityQuery: string; districtQuery: string; neighborhoodQuery: string },
): LocationFilterValue {
  const cityInput = inputs.cityQuery.trim();
  if (!cityInput) {
    if (committed.radiusKm) return sanitizeLocationFilter({ radiusKm: committed.radiusKm });
    return sanitizeLocationFilter(committed);
  }

  const city = normalizeIl(cityInput);
  if (!city) return sanitizeLocationFilter({});

  const prevCity = committed.city ? normalizeIl(committed.city) : undefined;
  const cityChanged = prevCity !== undefined && prevCity !== city;

  if (cityChanged) {
    return sanitizeLocationFilter({ city });
  }

  const district = inputs.districtQuery.trim() || undefined;
  const neighborhood = inputs.neighborhoodQuery.trim() || undefined;

  return sanitizeLocationFilter({
    city,
    district,
    neighborhood: district ? neighborhood : undefined,
  });
}

export async function loadLocationFilter(): Promise<LocationFilterValue> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocationFilterValue) : {};
    return sanitizeLocationFilter(parsed);
  } catch {
    return {};
  }
}

export async function saveLocationFilter(v: LocationFilterValue): Promise<void> {
  const sanitized = sanitizeLocationFilter(v);
  try {
    if (Object.keys(sanitized).length === 0) {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    }
  } catch {
    /* ignore */
  }
}
