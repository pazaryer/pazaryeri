import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { WebShell } from './WebShell';
import { WebListingGrid } from './WebListingGrid';
import { WebTrustBar } from './WebTrustBar';
import { LocationFilterBar, LocationFilterValue } from '@/components/LocationFilterBar';

export function WebHomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<LocationFilterValue>({});
  const [coords, setCoords] = useState<{ lat?: number; lon?: number }>({});

  const handleSearch = () => {
    const q = search.trim();
    router.push(q ? `/kesfet?q=${encodeURIComponent(q)}` : '/kesfet');
  };

  const handleLocationChange = async (v: LocationFilterValue) => {
    setLocationFilter(v);
    if (v.radiusKm) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        }
      } catch {
        setCoords({});
      }
    } else {
      setCoords({});
    }
  };

  return (
    <WebShell searchQuery={search} onSearchChange={setSearch} onSearchSubmit={handleSearch}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <WebTrustBar />
        <LocationFilterBar value={locationFilter} onChange={handleLocationChange} />
        <WebListingGrid
          title="Güncel İlanlar"
          location={locationFilter}
          lat={coords.lat}
          lon={coords.lon}
        />
      </ScrollView>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 24 },
});
