import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Platform,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { ListingCard } from '@/components/ListingCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Logo } from '@/components/Logo';
import { useListings } from '@/lib/hooks';

const CATEGORIES = ['Tümü', 'Elektronik', 'Araç', 'Mobilya', 'Moda', 'Spor', 'Ev', 'Diğer'];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const headerTop = isWeb ? 67 : insets.top;

  const [selectedCategory, setSelectedCategory] = useState('Tümü');

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
  });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const col1 = allItems.filter((_, i) => i % 2 === 0);
  const col2 = allItems.filter((_, i) => i % 2 === 1);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: headerTop,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <Logo size={28} />
            <Text style={[styles.brandText, { color: colors.foreground }]}>Pazaryeri</Text>
          </View>
          <Ionicons name="notifications-outline" size={24} color={colors.foreground} />
        </View>
        <View style={styles.searchContainer}>
          <View
            style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
            onTouchEnd={() => router.push('/(tabs)/explore')}
          >
            <Ionicons name="search" size={20} color={colors.mutedForeground} />
            <TextInput
              placeholder="Telefon, araba, mobilya..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              editable={false}
              pointerEvents="none"
            />
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={[{ id: 'grid' }]}
          renderItem={() => (
            <View style={styles.masonryContainer}>
              <View style={styles.column}>
                {col1.map((item) => (
                  <ListingCard key={item.id} item={item} />
                ))}
              </View>
              <View style={styles.column}>
                {col2.map((item) => (
                  <ListingCard key={item.id} item={item} />
                ))}
              </View>
            </View>
          )}
          keyExtractor={() => 'grid'}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <CategoryFilter
                categories={CATEGORIES}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.mutedForeground }}>Henüz ilan yok</Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={{ margin: 20 }} color={colors.primary} />
            ) : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  searchContainer: { width: '100%' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16 },
  listHeader: { paddingBottom: 8 },
  masonryContainer: { flexDirection: 'row', paddingHorizontal: 10 },
  column: { flex: 1, flexDirection: 'column' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
});
