import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { WebShell } from '@/components/web/WebShell';
import { WebListingGrid } from '@/components/web/WebListingGrid';
import { LocationFilterBar, LocationFilterValue } from '@/components/LocationFilterBar';

export default function KesfetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; kategori?: string }>();
  const [search, setSearch] = useState(typeof params.q === 'string' ? params.q : '');
  const [locationFilter, setLocationFilter] = useState<LocationFilterValue>({});
  const [coords, setCoords] = useState<{ lat?: number; lon?: number }>({});

  if (Platform.OS !== 'web') {
    return <Redirect href="/(tabs)/explore" />;
  }

  const category = typeof params.kategori === 'string' ? params.kategori : undefined;
  const query = typeof params.q === 'string' ? params.q : search || undefined;

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
    <WebShell
      searchQuery={search}
      onSearchChange={setSearch}
      onSearchSubmit={handleSearch}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <LocationFilterBar value={locationFilter} onChange={handleLocationChange} />
        <WebListingGrid
          category={category}
          query={query}
          location={locationFilter}
          lat={coords.lat}
          lon={coords.lon}
          title={
            category
              ? `${category} İlanları`
              : query
                ? `"${query}" arama sonuçları`
                : 'Tüm İlanlar'
          }
        />
      </ScrollView>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 24 },
});
