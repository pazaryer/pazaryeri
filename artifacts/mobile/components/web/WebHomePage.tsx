import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { WebShell } from './WebShell';
import { WebListingGrid } from './WebListingGrid';
import { WebTrustBar } from './WebTrustBar';

export function WebHomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleSearch = () => {
    const q = search.trim();
    router.push(q ? `/kesfet?q=${encodeURIComponent(q)}` : '/kesfet');
  };

  return (
    <WebShell searchQuery={search} onSearchChange={setSearch} onSearchSubmit={handleSearch}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <WebTrustBar />
        <WebListingGrid title="Güncel İlanlar" />
      </ScrollView>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 24 },
});
