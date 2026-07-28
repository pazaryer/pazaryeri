import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useListings } from '@/lib/hooks';
import { WebListingCard } from './WebListingCard';
import type { LocationFilterValue } from '@/components/LocationFilterBar';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';

interface WebListingGridProps {
  category?: string;
  query?: string;
  title?: string;
  location?: LocationFilterValue;
  lat?: number;
  lon?: number;
}

export function WebListingGrid({ category, query, title, location, lat, lon }: WebListingGridProps) {
  const mobileWeb = useIsMobileWeb();
  const {
    data,
    isLoading,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useListings({
    category,
    q: query,
    city: location?.city,
    district: location?.district,
    radiusKm: location?.radiusKm,
    lat,
    lon,
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <View style={[styles.wrap, mobileWeb && styles.wrapMobile]}>
      {title && (
        <View style={[styles.header, mobileWeb && styles.headerMobile]}>
          <Text style={[styles.title, mobileWeb && styles.titleMobile]}>{title}</Text>
          <Pressable style={styles.refreshBtn} onPress={handleRefresh} disabled={isRefetching}>
            {isRefetching ? (
              <ActivityIndicator size="small" color="#3D1A78" />
            ) : (
              <Text style={styles.refreshText}>↻</Text>
            )}
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <View style={[styles.center, mobileWeb && styles.centerMobile]}>
          <ActivityIndicator size="large" color="#3D1A78" />
        </View>
      ) : items.length === 0 ? (
        <View style={[styles.center, mobileWeb && styles.centerMobile]}>
          <Text style={styles.empty}>Henüz ilan bulunamadı</Text>
          <Text style={styles.emptyHint}>İlk ilanı siz verin!</Text>
        </View>
      ) : (
        <>
          <View nativeID="pz-listing-grid" style={styles.grid}>
            {items.map((item) => (
              <WebListingCard key={item.id} item={item} />
            ))}
          </View>
          {hasNextPage && (
            <Pressable style={[styles.moreBtn, mobileWeb && styles.moreBtnMobile]} onPress={loadMore} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? (
                <ActivityIndicator color="#3D1A78" />
              ) : (
                <Text style={styles.moreBtnText}>Daha Fazla Yükle</Text>
              )}
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  wrapMobile: { paddingHorizontal: 12, paddingVertical: 12 },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerMobile: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#1A0A2E', letterSpacing: -0.5, flex: 1 },
  titleMobile: { fontSize: 17 },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E0F4',
    backgroundColor: '#FFFFFF',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: { color: '#3D1A78', fontWeight: '700', fontSize: 16 },
  grid: { width: '100%' },
  center: { padding: 60, alignItems: 'center', gap: 8 },
  centerMobile: { padding: 40 },
  empty: { color: '#1A0A2E', fontSize: 18, fontWeight: '600' },
  emptyHint: { color: '#7A6B8A', fontSize: 14 },
  moreBtn: {
    alignSelf: 'center',
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3D1A78',
  },
  moreBtnMobile: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, width: '100%' },
  moreBtnText: { color: '#3D1A78', fontWeight: '700', fontSize: 15, textAlign: 'center' },
});
