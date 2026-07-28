import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  FlatList,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useListings } from '@/lib/hooks';
import { ListingCard, LISTING_GRID_COLS } from '@/components/ListingCard';
import { CategoryTile } from '@/components/CategoryTile';
import { MOBILE_EXPLORE_CATEGORIES } from '@/lib/categories';
import { BRAND } from '@/constants/brand';
import { useMobileLocation } from '@/contexts/MobileLocationContext';

const { width } = Dimensions.get('window');
const CAT_GAP = 7;
const CAT_WIDTH = (width - 32 - CAT_GAP * 3) / 4;

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const paddingTop = isWeb ? 67 : insets.top;
  const { filter, coords, label, openPicker, ready } = useMobileLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    data: listingsData,
    isLoading: listingsLoading,
    refetch,
    isRefetching,
  } = useListings({
    category: selectedCategory && searchQuery.length < 2 ? selectedCategory : undefined,
    q: searchQuery.length >= 2 ? searchQuery : undefined,
    city: filter.city,
    district: filter.district,
    radiusKm: filter.radiusKm,
    lat: coords.lat,
    lon: coords.lon,
  });

  const allItems = listingsData?.pages.flatMap((p) => p.items) ?? [];
  const showSearch = searchQuery.length >= 2;

  const trending = useMemo(() => {
    const titles = allItems.slice(0, 8).map((item) => item.title.split(/\s+/).slice(0, 2).join(' '));
    return [...new Set(titles)].slice(0, 4);
  }, [allItems]);

  const selectCategory = useCallback((name: string) => {
    setSearchQuery('');
    setSelectedCategory(name);
  }, []);

  const clearCategory = useCallback(() => setSelectedCategory(null), []);

  const listHeader = (
    <>
      <View style={[styles.hero, { paddingTop: paddingTop + 6 }]}>
        <Text style={styles.heroTitle}>Keşfet</Text>

        <Pressable style={styles.locationPill} onPress={openPicker}>
          <Ionicons name="location-outline" size={13} color={BRAND.primary} />
          <Text style={styles.locationText} numberOfLines={1}>{label}</Text>
          <Ionicons name="chevron-down" size={12} color={BRAND.textMuted} />
        </Pressable>

        <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Ionicons name="search" size={15} color={BRAND.textMuted} />
          <TextInput
            placeholder="Ara..."
            placeholderTextColor={BRAND.textMuted}
            style={[styles.searchInput, { color: colors.foreground }]}
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              if (t.length >= 2) setSelectedCategory(null);
            }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => { setSearchQuery(''); setSelectedCategory(null); }} hitSlop={8}>
              <Ionicons name="close-circle" size={15} color={BRAND.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {!showSearch && !selectedCategory && trending.length > 0 && (
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {trending.map((term) => (
              <Pressable
                key={term}
                style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setSearchQuery(term)}
              >
                <Text style={[styles.chipText, { color: colors.foreground }]}>{term}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {!showSearch && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kategoriler</Text>
            {selectedCategory ? (
              <Pressable onPress={clearCategory}>
                <Text style={styles.clearFilter}>Temizle</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.categoryGrid}>
            {MOBILE_EXPLORE_CATEGORIES.map((cat) => (
              <CategoryTile
                key={cat.name}
                name={cat.name}
                icon={cat.icon}
                image={cat.imageThumb}
                active={selectedCategory === cat.name}
                onPress={() => selectCategory(cat.name)}
                style={{ width: CAT_WIDTH }}
                variant="micro"
              />
            ))}
          </View>
        </View>
      )}

      <View style={[styles.section, styles.resultsHeader]}>
        <Text style={styles.resultsTitle}>
          {showSearch ? `"${searchQuery}"` : selectedCategory ?? 'İlanlar'}
        </Text>
        {allItems.length > 0 && <Text style={styles.resultCount}>{allItems.length}</Text>}
      </View>
    </>
  );

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={allItems}
      keyExtractor={(item) => item.id}
      numColumns={LISTING_GRID_COLS}
      columnWrapperStyle={styles.resultsRow}
      renderItem={({ item }) => <ListingCard item={item} compact />}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        listingsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>İlan bulunamadı</Text>
          </View>
        )
      }
      contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: BRAND.background,
  },
  heroTitle: { fontSize: 22, fontWeight: '600', color: BRAND.text, marginBottom: 10 },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: BRAND.border,
    marginBottom: 10,
    maxWidth: '100%',
  },
  locationText: { fontSize: 12, fontWeight: '500', color: BRAND.text, flexShrink: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
    gap: 6,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  section: { marginTop: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: BRAND.text },
  clearFilter: { fontSize: 12, fontWeight: '500', color: BRAND.primary },
  chipRow: { gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '500' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CAT_GAP },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  resultsTitle: { fontSize: 13, fontWeight: '600', color: BRAND.text },
  resultCount: { fontSize: 11, color: BRAND.textMuted, fontWeight: '500' },
  resultsRow: { justifyContent: 'space-between', gap: 7 },
  empty: { alignItems: 'center', paddingVertical: 28 },
  emptyText: { color: BRAND.textMuted, fontSize: 13 },
});
