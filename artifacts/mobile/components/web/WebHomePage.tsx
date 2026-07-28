import React, { useState } from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { WebShell } from './WebShell';
import { WebListingGrid } from './WebListingGrid';
import { WebHeroBanner } from './WebHeroBanner';
import { WebTrendCategories } from './WebTrendCategories';
import { LocationFilterBar, LocationFilterValue } from '@/components/LocationFilterBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { LISTING_CATEGORIES } from '@/lib/categories';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';
import { WEB_THEME } from '@/lib/web-theme';

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

  const body = (
    <>
      <WebHeroBanner />
      <WebTrendCategories />

      <View nativeID="pz-filter-section" style={[styles.filterSection, mobileWeb && styles.filterSectionMobile]}>
        <Text style={styles.sectionLabel}>Kategoriye göre filtrele</Text>
        <CategoryFilter
          categories={[...LISTING_CATEGORIES]}
          selectedCategory={category}
          onSelect={setCategory}
        />
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Konum</Text>
        <LocationFilterBar value={locationFilter} onChange={handleLocationChange} />
      </View>

      <View style={styles.listingsSection}>
        <WebListingGrid
          title="Popüler İkinci El İlanlar"
          category={category === 'Tümü' ? undefined : category}
          location={locationFilter}
          lat={coords.lat}
          lon={coords.lon}
        />
      </View>
    </>
  );

  return (
    <WebShell searchQuery={search} onSearchChange={setSearch} onSearchSubmit={handleSearch}>
      {mobileWeb ? (
        <View style={styles.pageMobile}>{body}</View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      )}
    </WebShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 32 },
  pageMobile: { width: '100%', paddingBottom: 24 },
  filterSection: {
    maxWidth: WEB_THEME.maxWidth,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: WEB_THEME.surface,
    borderRadius: WEB_THEME.radiusCard,
    borderWidth: 1,
    borderColor: WEB_THEME.border,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  filterSectionMobile: { marginHorizontal: 12, marginTop: 10, borderRadius: 14 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: WEB_THEME.text,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  sectionLabelSpaced: { marginTop: 8 },
  listingsSection: {
    maxWidth: WEB_THEME.maxWidth,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: WEB_THEME.sectionTint,
    borderRadius: WEB_THEME.radiusCard,
    borderWidth: 1,
    borderColor: WEB_THEME.sectionTintBorder,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
});
