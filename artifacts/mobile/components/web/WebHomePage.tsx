import React, { useState } from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { WebShell } from './WebShell';
import { WebListingGrid } from './WebListingGrid';
import { WebTrustBar } from './WebTrustBar';
import { LocationFilterBar, LocationFilterValue } from '@/components/LocationFilterBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { LISTING_CATEGORIES } from '@/lib/categories';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';

export function WebHomePage() {
  const router = useRouter();
  const mobileWeb = useIsMobileWeb();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<LocationFilterValue>({});
  const [coords, setCoords] = useState<{ lat?: number; lon?: number }>({});
  const [category, setCategory] = useState('Tümü');

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

  const PageBody = ScrollView;
  const bodyProps = mobileWeb
    ? { style: styles.scroll, contentContainerStyle: styles.scrollContentMobile, showsVerticalScrollIndicator: false }
    : { style: styles.scroll, contentContainerStyle: styles.scrollContent };

  return (
    <WebShell searchQuery={search} onSearchChange={setSearch} onSearchSubmit={handleSearch}>
      <PageBody {...bodyProps}>
        {!mobileWeb && <WebTrustBar />}
        <View nativeID="pz-filter-section" style={[styles.filterSection, mobileWeb && styles.filterSectionMobile]}>
          <Text style={styles.filterLabel}>Kategoriler</Text>
          <CategoryFilter
            categories={[...LISTING_CATEGORIES]}
            selectedCategory={category}
            onSelect={setCategory}
          />
          <Text style={[styles.filterLabel, styles.filterLabelSpaced]}>Konum</Text>
          <LocationFilterBar value={locationFilter} onChange={handleLocationChange} />
        </View>
        <WebListingGrid
          title="Güncel İlanlar"
          category={category === 'Tümü' ? undefined : category}
          location={locationFilter}
          lat={coords.lat}
          lon={coords.lon}
        />
      </PageBody>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 24 },
  scrollContentMobile: { paddingBottom: 32, flexGrow: 1 },
  filterSection: { paddingVertical: 8, gap: 4, marginHorizontal: 16, marginTop: 8 },
  filterSectionMobile: { marginHorizontal: 0, marginTop: 12, paddingVertical: 12 },
  filterLabel: { fontSize: 13, fontWeight: '700', color: '#1A0A2E', paddingHorizontal: 14, marginBottom: 4 },
  filterLabelSpaced: { marginTop: 8 },
});
