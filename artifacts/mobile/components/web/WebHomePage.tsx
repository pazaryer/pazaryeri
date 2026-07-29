import React, { useState } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WebShell } from './WebShell';
import { WebListingGrid } from './WebListingGrid';
import { WebHeroBanner } from './WebHeroBanner';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { useWebLocation } from '@/contexts/WebLocationContext';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';
import { WEB_THEME } from '@/lib/web-theme';

function WebHomeContent() {
  const { filter, coords } = useWebLocation();

  return (
    <View style={styles.page}>
      <AnnouncementBanner embedded subtle style={{ marginTop: 8, marginBottom: 4 }} />
      <WebHeroBanner />
      <WebListingGrid
        title="Popüler İkinci El İlanlar"
        location={filter}
        lat={coords.lat}
        lon={coords.lon}
      />
    </View>
  );
}

export function WebHomePage() {
  const router = useRouter();
  const mobileWeb = useIsMobileWeb();
  const [search, setSearch] = useState('');

  const handleSearch = () => {
    const q = search.trim();
    router.push(q ? `/kesfet?q=${encodeURIComponent(q)}` : '/kesfet');
  };

  return (
    <WebShell searchQuery={search} onSearchChange={setSearch} onSearchSubmit={handleSearch}>
      {mobileWeb ? (
        <WebHomeContent />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <WebHomeContent />
        </ScrollView>
      )}
    </WebShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 32 },
  page: {
    width: '100%',
    maxWidth: WEB_THEME.maxWidth,
    alignSelf: 'center',
    paddingBottom: 24,
  },
});
