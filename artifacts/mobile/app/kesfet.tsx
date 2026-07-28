import React, { useState } from 'react';
import { Platform, View, ScrollView, StyleSheet } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { WebShell } from '@/components/web/WebShell';
import { WebListingGrid } from '@/components/web/WebListingGrid';
import { useWebLocation } from '@/contexts/WebLocationContext';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';
import { WEB_THEME } from '@/lib/web-theme';

function KesfetContent() {
  const params = useLocalSearchParams<{ q?: string; kategori?: string }>();
  const { filter, coords } = useWebLocation();

  const category = typeof params.kategori === 'string' ? params.kategori : undefined;
  const query = typeof params.q === 'string' ? params.q : undefined;

  return (
    <View style={styles.listingsSection}>
      <WebListingGrid
        category={category}
        query={query}
        location={filter}
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
    </View>
  );
}

export default function KesfetScreen() {
  const router = useRouter();
  const mobileWeb = useIsMobileWeb();
  const params = useLocalSearchParams<{ q?: string; kategori?: string }>();
  const [search, setSearch] = useState(typeof params.q === 'string' ? params.q : '');

  if (Platform.OS !== 'web') {
    return <Redirect href="/(tabs)/explore" />;
  }

  const handleSearch = () => {
    const q = search.trim();
    router.push(q ? `/kesfet?q=${encodeURIComponent(q)}` : '/kesfet');
  };

  return (
    <WebShell searchQuery={search} onSearchChange={setSearch} onSearchSubmit={handleSearch}>
      {mobileWeb ? (
        <View style={styles.pageMobile}>
          <KesfetContent />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <KesfetContent />
        </ScrollView>
      )}
    </WebShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 24 },
  pageMobile: { width: '100%', paddingBottom: 24 },
  listingsSection: {
    maxWidth: WEB_THEME.maxWidth,
    width: '100%',
    alignSelf: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
});
