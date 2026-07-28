import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  Text,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useColors } from '@/hooks/useColors';
import { ListingCard } from '@/components/ListingCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { LocationFilterBar, type LocationFilterValue } from '@/components/LocationFilterBar';
import { Logo } from '@/components/Logo';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { useListings, useNotifications } from '@/lib/hooks';
import { LISTING_CATEGORIES } from '@/lib/categories';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const headerTop = isWeb ? 67 : insets.top;

  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [locationFilter, setLocationFilter] = useState<LocationFilterValue>({});
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const { data: notificationsData } = useNotifications();
  const unreadNotifs = notificationsData?.items.filter((n) => !n.isRead).length ?? 0;

  useEffect(() => {
    if (locationFilter.radiusKm) {
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }))
        .catch(() => setCoords(null));
    }
  }, [locationFilter.radiusKm]);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListings({
    category: selectedCategory === 'Tümü' ? undefined : selectedCategory,
    city: locationFilter.city,
    district: locationFilter.district,
    radiusKm: locationFilter.radiusKm,
    lat: coords?.lat,
    lon: coords?.lon,
  });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: headerTop, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <Logo size={26} />
            <Text style={[styles.brandText, { color: colors.foreground }]}>Pazaryeri</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={12} style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
            {unreadNotifs > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.bellBadgeText}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text>
              </View>
            )}
          </Pressable>
        </View>
        <View style={styles.searchContainer}>
          <Pressable
            style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Ionicons name="search" size={18} color={colors.mutedForeground} />
            <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>Telefon, araba, mobilya...</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => <ListingCard item={item} compact />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <AnnouncementBanner embedded />
              <Text style={[styles.filterTitle, { color: colors.foreground }]}>Kategoriler</Text>
              <CategoryFilter
                categories={[...LISTING_CATEGORIES]}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
              />
              <Text style={[styles.filterTitle, { color: colors.foreground, marginTop: 8 }]}>Konum</Text>
              <LocationFilterBar value={locationFilter} onChange={setLocationFilter} />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.mutedForeground }}>Henüz ilan yok</Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator style={{ margin: 20 }} color={colors.primary} /> : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: insets.bottom + 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontSize: 20, fontWeight: '800' },
  bellBtn: { position: 'relative', padding: 4 },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  searchContainer: { width: '100%' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    gap: 8,
  },
  searchPlaceholder: { fontSize: 14 },
  listHeader: { paddingTop: 8, paddingBottom: 4 },
  filterTitle: { fontSize: 13, fontWeight: '700', paddingHorizontal: 14, marginBottom: 6, marginTop: 4 },
  row: { gap: 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
});
