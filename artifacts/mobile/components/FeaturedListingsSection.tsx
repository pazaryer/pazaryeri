import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ListingCard } from '@/components/ListingCard';
import { FEATURED_CARD_WIDTH } from '@/lib/listing-grid';
import { BRAND } from '@/constants/brand';
import type { ListingSummary } from '@/lib/hooks';

type Props = {
  items: ListingSummary[];
  loading?: boolean;
};

export const FeaturedListingsSection = React.memo(function FeaturedListingsSection({
  items,
  loading,
}: Props) {
  if (!loading && items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={16} color={BRAND.gold} />
          <Text style={styles.title}>Öne Çıkanlar</Text>
        </View>
        <Text style={styles.subtitle}>Reklam izleyerek öne çıkarılan ilanlar</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={BRAND.primary} />
      ) : (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item) => `featured-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ListingCard item={item} compact featured cardWidth={FEATURED_CARD_WIDTH} />
          )}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginTop: 4, marginBottom: 4 },
  header: { paddingHorizontal: GRID_HEADER_PAD, marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '700', color: '#2C2C2C' },
  subtitle: { fontSize: 11, color: '#8A8A8A', marginTop: 2 },
  list: { paddingHorizontal: GRID_HEADER_PAD, gap: 10 },
  loader: { paddingVertical: 24 },
});

const GRID_HEADER_PAD = 14;
