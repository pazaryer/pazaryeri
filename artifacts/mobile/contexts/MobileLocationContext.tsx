import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import type { LocationFilterValue } from '@/components/LocationFilterBar';
import {
  formatLocationLabel,
  loadLocationFilter,
  saveLocationFilter,
  sanitizeLocationFilter,
} from '@/lib/location-storage';

async function resolveFilterCoords(v: LocationFilterValue): Promise<{ lat?: number; lon?: number }> {
  if (v.radiusKm) {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted =
        status === 'granted' ||
        (await Location.requestForegroundPermissionsAsync()).status === 'granted';
      if (!granted) return {};
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: pos.coords.latitude, lon: pos.coords.longitude };
    } catch {
      return {};
    }
  }

  if (v.city) {
    try {
      const query = [v.district, v.city, 'Türkiye'].filter(Boolean).join(', ');
      const results = await Location.geocodeAsync(query);
      const hit = results[0];
      if (hit?.latitude != null && hit.longitude != null) {
        return { lat: hit.latitude, lon: hit.longitude };
      }
    } catch {
      /* ignore */
    }
  }

  return {};
}

type MobileLocationContextValue = {
  filter: LocationFilterValue;
  coords: { lat?: number; lon?: number };
  label: string;
  ready: boolean;
  locationReady: boolean;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  setFilter: (v: LocationFilterValue) => Promise<void>;
  clearFilter: () => Promise<void>;
  refreshCoords: () => Promise<void>;
};

const MobileLocationContext = createContext<MobileLocationContextValue | null>(null);

export function MobileLocationProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilterState] = useState<LocationFilterValue>({});
  const [coords, setCoords] = useState<{ lat?: number; lon?: number }>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [locationReady, setLocationReady] = useState(false);

  const refreshCoords = useCallback(async () => {
    try {
      const next = await resolveFilterCoords(filter);
      setCoords(next);
    } catch {
      setCoords({});
    } finally {
      setLocationReady(true);
    }
  }, [filter]);

  useEffect(() => {
    void loadLocationFilter().then(async (stored) => {
      const sanitized = sanitizeLocationFilter(stored);
      if (JSON.stringify(sanitized) !== JSON.stringify(stored)) {
        await saveLocationFilter(sanitized);
      }
      setFilterState(sanitized);
      const next = await resolveFilterCoords(sanitized);
      setCoords(next);
      setReady(true);
      setLocationReady(true);
    });
  }, []);

  const setFilter = useCallback(async (v: LocationFilterValue) => {
    const sanitized = sanitizeLocationFilter(v);
    setFilterState(sanitized);
    await saveLocationFilter(sanitized);
    const next = await resolveFilterCoords(sanitized);
    setCoords(next);
    setLocationReady(true);
  }, []);

  const clearFilter = useCallback(async () => {
    setFilterState({});
    setCoords({});
    setLocationReady(true);
    await saveLocationFilter({});
  }, []);

  const value = useMemo(
    () => ({
      filter,
      coords,
      label: formatLocationLabel(filter),
      ready,
      locationReady,
      pickerOpen,
      openPicker: () => setPickerOpen(true),
      closePicker: () => setPickerOpen(false),
      setFilter,
      clearFilter,
      refreshCoords,
    }),
    [filter, coords, ready, locationReady, pickerOpen, setFilter, clearFilter, refreshCoords],
  );

  return <MobileLocationContext.Provider value={value}>{children}</MobileLocationContext.Provider>;
}

export function useMobileLocation() {
  const ctx = useContext(MobileLocationContext);
  if (!ctx) throw new Error('useMobileLocation MobileLocationProvider içinde kullanılmalı');
  return ctx;
}
