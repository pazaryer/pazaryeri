import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ListingSummary, formatPrice, useToggleFavorite } from '@/lib/hooks';
import { formatListingLocation } from '@/lib/listing-location';
import { flatStyle } from '@/lib/flat-style';
import { BRAND } from '@/constants/brand';
import { listingThumbImageProps } from '@/lib/listing-image-props';

const SCREEN_WIDTH = Dimensions.get('window').width;
export const LISTING_GRID_COLS = 3;
const GRID_H_PADDING = 14;
const GRID_GAP = 7;
export const LISTING_CARD_WIDTH =
  (SCREEN_WIDTH - GRID_H_PADDING * 2 - GRID_GAP * (LISTING_GRID_COLS - 1)) / LISTING_GRID_COLS;

interface ListingCardProps {
  item: ListingSummary;
  compact?: boolean;
}

export const ListingCard = React.memo(function ListingCard({ item, compact = false }: ListingCardProps) {
  const colors = useColors();
  const toggleFavorite = useToggleFavorite();

  const handleFavorite = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    toggleFavorite.mutate({ listingId: item.id, isFavorite: item.isFavorite });
  };

  return (
    <Link href={`/listing/${item.id}`} asChild>
      <Pressable style={flatStyle(styles.cardContainer, compact && styles.compactContainer)}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.imageContainer, compact ? styles.imageCompact : styles.imageFull]}>
            <Image
              source={{ uri: item.image }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              recyclingKey={item.id}
              {...listingThumbImageProps}
            />
            {item.status === 'sold' && (
              <View style={styles.soldOverlay}>
                <Text style={styles.soldText}>SATILDI</Text>
              </View>
            )}
            {item.favoriteCount > 0 && (
              <View style={styles.favCountBadge}>
                <Ionicons name="heart" size={9} color="#C62828" />
                <Text style={styles.favCountText}>{item.favoriteCount}</Text>
              </View>
            )}
            <Pressable style={styles.favoriteButton} onPress={handleFavorite} hitSlop={4}>
              <Ionicons
                name={item.isFavorite ? 'heart' : 'heart-outline'}
                size={11}
                color={item.isFavorite ? BRAND.gold : BRAND.primary}
              />
            </Pressable>
          </View>

          <View style={[styles.details, compact && styles.compactDetails]}>
            <Text
              style={[styles.price, compact && styles.compactPrice, { color: colors.primary }]}
              numberOfLines={1}
            >
              {formatPrice(item.price)}
            </Text>
            <Text
              style={[styles.title, compact && styles.compactTitle, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={9} color={colors.mutedForeground} />
              <Text style={[styles.distance, { color: colors.mutedForeground }]} numberOfLines={1}>
                {formatListingLocation(item)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    paddingBottom: 10,
  },
  compactContainer: {
    width: LISTING_CARD_WIDTH,
    marginBottom: GRID_GAP,
  },
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: BRAND.primaryLight,
  },
  imageCompact: { aspectRatio: 1.2 },
  imageFull: { height: 160 },
  favoriteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  favCountBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  favCountText: { fontSize: 9, fontWeight: '700', color: '#5C4D6E' },
  details: { padding: 8, gap: 1 },
  compactDetails: { paddingHorizontal: 6, paddingVertical: 5, gap: 0 },
  price: { fontSize: 14, fontWeight: '700' },
  compactPrice: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 12, fontWeight: '500', lineHeight: 15 },
  compactTitle: { fontSize: 10, lineHeight: 13, fontWeight: '500' },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  distance: { fontSize: 9, flex: 1 },
});
