import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { LocationFilterValue } from '@/components/LocationFilterBar';

const STORAGE_KEY = 'pz-web-location';

type WebLocationContextValue = {
  filter: LocationFilterValue;
  coords: { lat?: number; lon?: number };
  label: string;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  setFilter: (v: LocationFilterValue) => Promise<void>;
  clearFilter: () => void;
};

const WebLocationContext = createContext<WebLocationContextValue | null>(null);

function formatLabel(v: LocationFilterValue): string {
  if (v.city) return v.city;
  if (v.district) return v.district;
  if (v.radiusKm) return `${v.radiusKm} km`;
  return 'Türkiye';
}

function loadStoredFilter(): LocationFilterValue {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocationFilterValue) : {};
  } catch {
    return {};
  }
}

function storeFilter(v: LocationFilterValue) {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    if (Object.keys(v).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    }
  } catch {
    /* ignore */
  }
}

export function WebLocationProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilterState] = useState<LocationFilterValue>(loadStoredFilter);
  const [coords, setCoords] = useState<{ lat?: number; lon?: number }>({});
  const [pickerOpen, setPickerOpen] = useState(false);

  const resolveCoords = useCallback(async (v: LocationFilterValue) => {
    if (v.radiusKm) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          return;
        }
      } catch {
        /* ignore */
      }
    } else if (v.city) {
      try {
        const query = [v.district, v.city, 'Türkiye'].filter(Boolean).join(', ');
        const results = await Location.geocodeAsync(query);
        const hit = results[0];
        if (hit?.latitude != null && hit.longitude != null) {
          setCoords({ lat: hit.latitude, lon: hit.longitude });
          return;
        }
      } catch {
        /* ignore */
      }
    }
    setCoords({});
  }, []);

  useEffect(() => {
    void resolveCoords(filter);
  }, [filter, resolveCoords]);

  const setFilter = useCallback(
    async (v: LocationFilterValue) => {
      setFilterState(v);
      storeFilter(v);
      await resolveCoords(v);
    },
    [resolveCoords],
  );

  const clearFilter = useCallback(() => {
    setFilterState({});
    storeFilter({});
    setCoords({});
  }, []);

  const value = useMemo(
    () => ({
      filter,
      coords,
      label: formatLabel(filter),
      pickerOpen,
      openPicker: () => setPickerOpen(true),
      closePicker: () => setPickerOpen(false),
      setFilter,
      clearFilter,
    }),
    [filter, coords, pickerOpen, setFilter, clearFilter],
  );

  return <WebLocationContext.Provider value={value}>{children}</WebLocationContext.Provider>;
}

export function useWebLocation() {
  const ctx = useContext(WebLocationContext);
  if (!ctx) throw new Error('useWebLocation WebShell içinde kullanılmalı');
  return ctx;
}
