import React, { useMemo, useState } from 'react';
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
import { useColors } from '@/hooks/useColors';
import { useListings } from '@/lib/hooks';
import { ListingCard } from '@/components/ListingCard';
import { MOBILE_EXPLORE_CATEGORIES } from '@/lib/categories';

const { width } = Dimensions.get('window');
const CARD_GAP = 10;
const CATEGORY_WIDTH = (width - 32 - CARD_GAP) / 2;

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const paddingTop = isWeb ? 67 : insets.top;

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
  });

  const allItems = listingsData?.pages.flatMap((p) => p.items) ?? [];
  const showSearch = searchQuery.length >= 2;
  const displayItems = allItems;

  const trending = useMemo(() => {
    const titles = allItems.slice(0, 8).map((item) => {
      const words = item.title.trim().split(/\s+/).slice(0, 2).join(' ');
      return words.length >= 3 ? words : item.title.slice(0, 24);
    });
    return [...new Set(titles)].slice(0, 6);
  }, [allItems]);

  const openCategory = (name: string) => {
    setSearchQuery('');
    setSelectedCategory(name);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
    >
      <LinearGradient
        colors={['#3D1A78', '#1A0A2E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: paddingTop + 12 }]}
      >
        <Text style={styles.heroTitle}>Keşfet</Text>
        <Text style={styles.heroSub}>Canlı ilanlar arasında ara, kategoriye göz at</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9D8BB5" />
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
            <Pressable
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#C9A84C" />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {!showSearch && !selectedCategory && trending.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Güncel İlanlar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {trending.map((label) => (
              <Pressable
                key={label}
                style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setSearchQuery(label)}
              >
                <Ionicons name="flash-outline" size={14} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.foreground }]} numberOfLines={1}>
                  {label}
                </Text>
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
                <Text style={[styles.clearFilter, { color: colors.primary }]}>Tümünü göster</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.categoryGrid}>
            {MOBILE_EXPLORE_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.name;
              return (
                <Pressable
                  key={cat.name}
                  style={[
                    styles.categoryCard,
                    { width: CATEGORY_WIDTH },
                    active && styles.categoryCardActive,
                  ]}
                  onPress={() => openCategory(cat.name)}
                >
                  <LinearGradient
                    colors={cat.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={28} color="#FFF" />
                  <Text style={styles.categoryLabel}>{cat.name}</Text>
                  {active && (
                    <View style={styles.activeBadge}>
                      <Ionicons name="checkmark" size={12} color="#3D1A78" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {showSearch
            ? `"${searchQuery}" sonuçları`
            : selectedCategory
              ? `${selectedCategory} ilanları`
              : 'Son eklenen ilanlar'}
        </Text>

        {(listingsLoading) && displayItems.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : displayItems.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>İlan bulunamadı</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Farklı bir arama deneyin veya ilk ilanı siz verin
            </Text>
            <Pressable
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/post')}
            >
              <Text style={styles.emptyBtnText}>İlan Ver</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.resultsGrid}>
            {displayItems.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 8,
  },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#1A0A2E' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  clearFilter: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    maxWidth: 180,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },
  categoryCard: {
    height: 96,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  categoryCardActive: {
    borderWidth: 2,
    borderColor: '#C9A84C',
  },
  categoryLabel: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  empty: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#FFF', fontWeight: '700' },
});
