import React, { useState } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WebShell } from './WebShell';
import { WebListingGrid } from './WebListingGrid';
import { WebHeroBanner } from './WebHeroBanner';
import { WebTrendCategories } from './WebTrendCategories';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';
import { WEB_THEME } from '@/lib/web-theme';

export function WebHomePage() {
  const router = useRouter();
  const mobileWeb = useIsMobileWeb();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tümü');

  const handleSearch = () => {
    const q = search.trim();
    if (q) {
      router.push(`/kesfet?q=${encodeURIComponent(q)}`);
      return;
    }
    if (category !== 'Tümü') {
      router.push(`/kesfet?kategori=${encodeURIComponent(category)}`);
      return;
    }
    router.push('/kesfet');
  };

  const handleCategory = (cat: string) => {
    if (cat === 'Yeni İlanlar' || cat === 'Ücretsiz') {
      setCategory('Tümü');
      return;
    }
    setCategory(cat);
  };

  const body = (
    <View style={styles.page}>
      <WebHeroBanner />
      <WebTrendCategories selectedCategory={category} onCategorySelect={handleCategory} />
      <WebListingGrid
        title="Popüler İkinci El İlanlar"
        category={category === 'Tümü' ? undefined : category}
      />
    </View>
  );

  return (
    <WebShell searchQuery={search} onSearchChange={setSearch} onSearchSubmit={handleSearch}>
      {mobileWeb ? (
        body
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
  page: {
    width: '100%',
    maxWidth: WEB_THEME.maxWidth,
    alignSelf: 'center',
    paddingBottom: 24,
  },
});
