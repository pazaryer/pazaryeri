import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocationFilterValue } from '@/components/LocationFilterBar';

const STORAGE_KEY = 'pz_location_v1';

export function formatLocationLabel(v: LocationFilterValue): string {
  if (v.neighborhood && v.district && v.city) return `${v.neighborhood}, ${v.district}, ${v.city}`;
  if (v.district && v.city) return `${v.district}, ${v.city}`;
  if (v.city) return v.city;
  if (v.radiusKm) return `${v.radiusKm} km yakınında`;
  return 'Türkiye';
}

export async function loadLocationFilter(): Promise<LocationFilterValue> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocationFilterValue) : {};
  } catch {
    return {};
  }
}

export async function saveLocationFilter(v: LocationFilterValue): Promise<void> {
  try {
    if (Object.keys(v).length === 0) {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    }
  } catch {
    /* ignore */
  }
}
