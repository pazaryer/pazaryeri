import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import type { LocationFilterValue } from '@/components/LocationFilterBar';
import { formatLocationLabel, loadLocationFilter, saveLocationFilter } from '@/lib/location-storage';

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
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted =
        status === 'granted' ||
        (await Location.requestForegroundPermissionsAsync()).status === 'granted';
      if (!granted) {
        setCoords({});
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    } catch {
      setCoords({});
    } finally {
      setLocationReady(true);
    }
  }, []);

  useEffect(() => {
    void loadLocationFilter().then((stored) => {
      setFilterState(stored);
      setReady(true);
    });
    void refreshCoords();
  }, [refreshCoords]);

  const setFilter = useCallback(async (v: LocationFilterValue) => {
    setFilterState(v);
    await saveLocationFilter(v);
  }, []);

  const clearFilter = useCallback(async () => {
    setFilterState({});
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
