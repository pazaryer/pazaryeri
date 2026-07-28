import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useListings } from '@/lib/hooks';
import { WebListingCard } from './WebListingCard';
import type { LocationFilterValue } from '@/components/LocationFilterBar';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';
import { WEB_THEME } from '@/lib/web-theme';
import { flatStyle } from '@/lib/flat-style';

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

  return (
    <View style={[styles.wrap, mobileWeb && styles.wrapMobile]}>
      {title && (
        <View style={styles.header}>
          <Text style={[styles.title, mobileWeb && styles.titleMobile]}>{title}</Text>
          <Pressable style={styles.seeAllBtn} onPress={() => void refetch()} disabled={isRefetching}>
            {isRefetching ? (
              <ActivityIndicator size="small" color={WEB_THEME.brand} />
            ) : (
              <Text style={styles.seeAllText}>Yenile</Text>
            )}
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={WEB_THEME.brand} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Henüz ilan bulunamadı</Text>
          <Text style={styles.emptyHint}>İlk ilanı siz verin — ücretsiz!</Text>
        </View>
      ) : (
        <>
          <View nativeID="pz-listing-grid" style={styles.grid}>
            {items.map((item) => (
              <WebListingCard key={item.id} item={item} />
            ))}
          </View>
          {hasNextPage && (
            <Pressable
              style={flatStyle(styles.moreBtn, mobileWeb && styles.moreBtnMobile)}
              onPress={loadMore}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <ActivityIndicator color={WEB_THEME.brand} />
              ) : (
                <Text style={styles.moreBtnText}>Daha Fazla İlan Göster</Text>
              )}
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingHorizontal: 16, paddingVertical: 16 },
  wrapMobile: { paddingHorizontal: 12, paddingVertical: 12 },
  header: {
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: WEB_THEME.text, letterSpacing: -0.3, flex: 1 },
  titleMobile: { fontSize: 17 },
  seeAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: WEB_THEME.radiusPill,
    backgroundColor: WEB_THEME.surface,
    borderWidth: 1,
    borderColor: WEB_THEME.border,
    minWidth: 72,
    alignItems: 'center',
  },
  seeAllText: { color: WEB_THEME.brand, fontWeight: '700', fontSize: 13 },
  grid: { width: '100%' },
  center: { padding: 48, alignItems: 'center', gap: 8 },
  empty: { color: WEB_THEME.text, fontSize: 17, fontWeight: '700' },
  emptyHint: { color: WEB_THEME.textMuted, fontSize: 14 },
  moreBtn: {
    alignSelf: 'center',
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: WEB_THEME.radiusPill,
    backgroundColor: WEB_THEME.surface,
    borderWidth: 1.5,
    borderColor: WEB_THEME.brand,
  },
  moreBtnMobile: { marginTop: 14, width: '100%' },
  moreBtnText: { color: WEB_THEME.brand, fontWeight: '700', fontSize: 14, textAlign: 'center' },
});
