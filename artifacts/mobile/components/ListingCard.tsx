import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ListingSummary, formatPrice, useToggleFavorite } from '@/lib/hooks';
import { formatListingLocation } from '@/lib/listing-location';
import { flatStyle } from '@/lib/flat-style';
import { BRAND } from '@/constants/brand';
import { listingThumbImageProps } from '@/lib/listing-image-props';
import { listingThumbUrl } from '@/lib/image-url';
import {
  DEFAULT_GRID_COLS,
  GRID_GAP,
  listingCardWidth,
} from '@/lib/listing-grid';

export const LISTING_GRID_COLS = DEFAULT_GRID_COLS;
export const LISTING_CARD_WIDTH = listingCardWidth(DEFAULT_GRID_COLS);

interface ListingCardProps {
  item: ListingSummary;
  compact?: boolean;
  featured?: boolean;
  gridColumns?: number;
  cardWidth?: number;
}

export const ListingCard = React.memo(function ListingCard({
  item,
  compact = false,
  featured = false,
  gridColumns = DEFAULT_GRID_COLS,
  cardWidth,
}: ListingCardProps) {
  const colors = useColors();
  const toggleFavorite = useToggleFavorite();
  const width = useMemo(
    () => cardWidth ?? (compact ? listingCardWidth(gridColumns) : undefined),
    [cardWidth, compact, gridColumns],
  );

  const handleFavorite = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    toggleFavorite.mutate({ listingId: item.id, isFavorite: item.isFavorite });
  };

  return (
    <Link href={`/listing/${item.id}`} asChild>
      <Pressable
        style={flatStyle(
          styles.cardContainer,
          compact && width != null && { width, marginBottom: GRID_GAP },
        )}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            (featured || item.isPromoted) && styles.promotedCard,
          ]}
        >
          <View
            style={[
              styles.imageContainer,
              compact ? (featured ? styles.imageFeatured : styles.imageCompact) : styles.imageFull,
            ]}
          >
            {item.image ? (
              <Image
                source={{
                  uri: listingThumbUrl(item.image) ?? item.image,
                  width: 128,
                  height: 154,
                }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                recyclingKey={`listing-thumb-${item.id}`}
                {...listingThumbImageProps}
              />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, styles.imagePlaceholder]}>
                <Ionicons name="image-outline" size={compact ? 20 : 28} color={colors.mutedForeground} />
              </View>
            )}
            {(featured || item.isPromoted) && (
              <View style={styles.promotedBadge}>
                <Ionicons name="sparkles" size={9} color="#FFF" />
                <Text style={styles.promotedBadgeText}>Öne Çıkan</Text>
              </View>
            )}
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
              style={[
                styles.title,
                compact && styles.compactTitle,
                compact && styles.compactTitleFixed,
                { color: colors.foreground },
              ]}
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
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      default: {},
    }),
  },
  promotedCard: {
    borderColor: BRAND.gold,
    borderWidth: 1.5,
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: BRAND.primaryLight,
  },
  imageCompact: { aspectRatio: 1.15 },
  imageFeatured: { aspectRatio: 1.05 },
  imageFull: { height: 160 },
  imagePlaceholder: {
    backgroundColor: BRAND.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  compactTitleFixed: { minHeight: 26 },
  promotedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: BRAND.primary,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    zIndex: 2,
  },
  promotedBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '800' },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  distance: { fontSize: 9, flex: 1 },
});
