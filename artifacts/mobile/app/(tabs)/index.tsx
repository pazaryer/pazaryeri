import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { ListingCard, LISTING_GRID_COLS } from '@/components/ListingCard';
import { MobileTrendCategories } from '@/components/MobileTrendCategories';
import { useListings, useNotifications } from '@/lib/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { useMobileLocation } from '@/contexts/MobileLocationContext';
import { BRAND } from '@/constants/brand';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { filter, coords, label, openPicker, ready, locationReady } = useMobileLocation();
  const [selectedCategory, setSelectedCategory] = useState('Tümü');

  const listingsEnabled =
    ready && (!filter.radiusKm || (locationReady && coords.lat != null && coords.lon != null));

  const { data: notificationsData } = useNotifications(!!user);
  const unreadNotifs = notificationsData?.items.filter((n) => !n.isRead).length ?? 0;

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListings(
    {
      category: selectedCategory === 'Tümü' ? undefined : selectedCategory,
      city: filter.city,
      district: filter.district,
      radiusKm: filter.radiusKm,
      lat: coords.lat,
      lon: coords.lon,
    },
    { enabled: listingsEnabled },
  );

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  const needsGps =
    filter.radiusKm != null && locationReady && (coords.lat == null || coords.lon == null);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: '#FFFFFF', borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.locationBtn} onPress={openPicker}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>{label}</Text>
            <Ionicons name="chevron-down" size={14} color="#717171" />
          </Pressable>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={12} style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
            {unreadNotifs > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text>
              </View>
            )}
          </Pressable>
        </View>
        <Pressable style={styles.searchBar} onPress={() => router.push('/(tabs)/explore')}>
          <Ionicons name="search" size={18} color="#9E9E9E" />
          <Text style={styles.searchPlaceholder}>İlan, marka, kategori ara...</Text>
        </Pressable>
      </View>

      {needsGps ? (
        <View style={styles.center}>
          <Text style={{ color: colors.mutedForeground, textAlign: 'center', paddingHorizontal: 24 }}>
            Mesafe filtresi için konum izni gerekli. Telefon ayarlarından konum iznini açın.
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(item) => item.id}
          numColumns={LISTING_GRID_COLS}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => <ListingCard item={item} compact />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <MobileTrendCategories selected={selectedCategory} onSelect={setSelectedCategory} />
              <Text style={styles.sectionTitle}>Popüler İlanlar</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.mutedForeground }}>Bu konumda ilan bulunamadı</Text>
              <Pressable onPress={openPicker} style={styles.changeLocationBtn}>
                <Text style={styles.changeLocationText}>Konumu değiştir</Text>
              </Pressable>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator style={{ margin: 20 }} color={colors.primary} /> : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, marginRight: 12 },
  locationText: { fontSize: 15, fontWeight: '700', color: '#2C2C2C', flexShrink: 1 },
  bellBtn: { position: 'relative', padding: 4 },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#F4F4F4',
    gap: 8,
  },
  searchPlaceholder: { fontSize: 14, color: '#9E9E9E' },
  listHeader: { paddingTop: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  row: { justifyContent: 'space-between', gap: 7 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  changeLocationBtn: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 8 },
  changeLocationText: { color: BRAND.primary, fontWeight: '600', fontSize: 14 },
});
