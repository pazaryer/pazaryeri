import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useColors } from '@/hooks/useColors';
import { useListings } from '@/lib/hooks';
import { ListingCard } from '@/components/ListingCard';
import { LocationFilterBar, type LocationFilterValue } from '@/components/LocationFilterBar';
import { MOBILE_EXPLORE_CATEGORIES } from '@/lib/categories';

const { width } = Dimensions.get('window');
const CARD_GAP = 8;
const CATEGORY_WIDTH = (width - 32 - CARD_GAP * 2) / 3;

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const paddingTop = isWeb ? 67 : insets.top;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<LocationFilterValue>({});
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (locationFilter.radiusKm) {
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }))
        .catch(() => setCoords(null));
    }
  }, [locationFilter.radiusKm]);

  const {
    data: listingsData,
    isLoading: listingsLoading,
    refetch,
    isRefetching,
  } = useListings({
    category: selectedCategory && searchQuery.length < 2 ? selectedCategory : undefined,
    q: searchQuery.length >= 2 ? searchQuery : undefined,
    city: locationFilter.city,
    district: locationFilter.district,
    radiusKm: locationFilter.radiusKm,
    lat: coords?.lat,
    lon: coords?.lon,
  });

  const allItems = listingsData?.pages.flatMap((p) => p.items) ?? [];
  const showSearch = searchQuery.length >= 2;

  const trending = useMemo(() => {
    const titles = allItems.slice(0, 6).map((item) => item.title.split(/\s+/).slice(0, 2).join(' '));
    return [...new Set(titles)].slice(0, 5);
  }, [allItems]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <LinearGradient
        colors={['#3D1A78', '#1A0A2E']}
        style={[styles.hero, { paddingTop: paddingTop + 10 }]}
      >
        <Text style={styles.heroTitle}>Keşfet</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9D8BB5" />
          <TextInput
            placeholder="Ne arıyorsunuz?"
            placeholderTextColor="#9D8BB5"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              if (t.length >= 2) setSelectedCategory(null);
            }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => { setSearchQuery(''); setSelectedCategory(null); }}>
              <Ionicons name="close-circle" size={18} color="#C9A84C" />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <LocationFilterBar value={locationFilter} onChange={setLocationFilter} />
      </View>

      {!showSearch && !selectedCategory && trending.length > 0 && (
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {trending.map((label) => (
              <Pressable
                key={label}
                style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setSearchQuery(label)}
              >
                <Text style={[styles.chipText, { color: colors.foreground }]}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {!showSearch && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Kategoriler</Text>
            {selectedCategory && (
              <Pressable onPress={() => setSelectedCategory(null)}>
                <Text style={[styles.clearFilter, { color: colors.primary }]}>Temizle</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.categoryGrid}>
            {MOBILE_EXPLORE_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.name;
              return (
                <Pressable
                  key={cat.name}
                  style={[styles.categoryCard, { width: CATEGORY_WIDTH }, active && styles.categoryCardActive]}
                  onPress={() => { setSearchQuery(''); setSelectedCategory(cat.name); }}
                >
                  <LinearGradient colors={cat.gradient} style={StyleSheet.absoluteFillObject} />
                  <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={18} color="#FFF" />
                  <Text style={styles.categoryLabel} numberOfLines={1}>{cat.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {showSearch ? `"${searchQuery}"` : selectedCategory ? selectedCategory : 'Son eklenen'}
        </Text>

        {listingsLoading && allItems.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : allItems.length === 0 ? (
          <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>İlan bulunamadı</Text>
        ) : (
          <View style={styles.resultsGrid}>
            {allItems.map((item) => (
              <ListingCard key={item.id} item={item} compact />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 16, paddingBottom: 18, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A0A2E' },
  section: { paddingHorizontal: 14, marginTop: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  clearFilter: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  chipRow: { gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },
  categoryCard: {
    height: 64,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  categoryCardActive: { borderWidth: 2, borderColor: '#C9A84C' },
  categoryLabel: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -2 },
});
