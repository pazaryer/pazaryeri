import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenLayout } from '@/components/ProfileScreenLayout';
import { ListingCard, LISTING_GRID_COLS } from '@/components/ListingCard';
import { WebShell } from '@/components/web/WebShell';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/lib/hooks';

function FavoritesContent() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useFavorites(!!user);
  const items = data?.items ?? [];

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="heart-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Giriş yapın</Text>
        <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
          Favorilerinizi görmek için giriş yapmalısınız
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={LISTING_GRID_COLS}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => <ListingCard item={item} compact />}
      ListHeaderComponent={
        <Text style={[styles.headerHint, { color: colors.mutedForeground }]}>
          {items.length} favori ilan
        </Text>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz favori yok</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Beğendiğiniz ilanları favorilere ekleyin, fiyat düşünce haber alın
          </Text>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
      contentContainerStyle={{
        paddingHorizontal: 12,
        paddingBottom: insets.bottom + 24,
        flexGrow: items.length ? undefined : 1,
      }}
      initialNumToRender={12}
      maxToRenderPerBatch={9}
      windowSize={7}
      removeClippedSubviews={Platform.OS === 'android'}
    />
  );
}

export default function FavoritesScreen() {
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    return (
      <WebShell>
        <View style={styles.webWrap}>
          <Text style={styles.webTitle}>Favorilerim</Text>
          <FavoritesContent />
        </View>
      </WebShell>
    );
  }

  return (
    <ProfileScreenLayout title="Favorilerim" scroll={false}>
      <FavoritesContent />
    </ProfileScreenLayout>
  );
}

const styles = StyleSheet.create({
  webWrap: { flex: 1, maxWidth: 1200, alignSelf: 'center', width: '100%', padding: 16 },
  webTitle: { fontSize: 24, fontWeight: '800', color: '#1A0A2E', marginBottom: 12 },
  row: { gap: 7 },
  headerHint: { fontSize: 13, fontWeight: '600', paddingVertical: 8, paddingHorizontal: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
