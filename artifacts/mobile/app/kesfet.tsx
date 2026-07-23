import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { WebShell } from '@/components/web/WebShell';
import { WebListingGrid } from '@/components/web/WebListingGrid';

export default function KesfetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; kategori?: string }>();
  const [search, setSearch] = useState(typeof params.q === 'string' ? params.q : '');

  if (Platform.OS !== 'web') {
    return <Redirect href="/(tabs)/explore" />;
  }

  const category = typeof params.kategori === 'string' ? params.kategori : undefined;
  const query = typeof params.q === 'string' ? params.q : search || undefined;

  const handleSearch = () => {
    const q = search.trim();
    router.push(q ? `/kesfet?q=${encodeURIComponent(q)}` : '/kesfet');
  };

  return (
    <WebShell
      searchQuery={search}
      onSearchChange={setSearch}
      onSearchSubmit={handleSearch}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <WebListingGrid
          category={category}
          query={query}
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
