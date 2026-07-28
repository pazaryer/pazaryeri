import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ListingSummary, formatPrice, useToggleFavorite } from '@/lib/hooks';

interface ListingCardProps {
  item: ListingSummary;
  compact?: boolean;
}

export function ListingCard({ item, compact = false }: ListingCardProps) {
  const colors = useColors();
  const toggleFavorite = useToggleFavorite();
  const imageHeight = compact ? 110 : 160;

  const handleFavorite = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    toggleFavorite.mutate({ listingId: item.id, isFavorite: item.isFavorite });
  };

  return (
    <Link href={`/listing/${item.id}`} asChild>
      <Pressable style={[styles.cardContainer, compact && styles.compactContainer]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.imageContainer, { height: imageHeight }]}>
            <Image source={{ uri: item.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={150} />
            {item.status === 'sold' && (
              <View style={styles.soldOverlay}>
                <Text style={styles.soldText}>SATILDI</Text>
              </View>
            )}
            <Pressable style={styles.favoriteButton} onPress={handleFavorite}>
              <Ionicons name={item.isFavorite ? 'heart' : 'heart-outline'} size={compact ? 16 : 18} color={colors.accent} />
            </Pressable>
          </View>

          <View style={[styles.details, compact && styles.compactDetails]}>
            <Text style={[styles.price, compact && styles.compactPrice, { color: colors.primary }]}>
              {formatPrice(item.price)}
            </Text>
            <Text style={[styles.title, compact && styles.compactTitle, { color: colors.foreground }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={10} color={colors.mutedForeground} />
              <Text style={[styles.distance, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.distance ?? item.district ?? item.city ?? 'Konum yok'}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  cardContainer: { flex: 1, margin: 5, minWidth: '46%' },
  compactContainer: { margin: 4, minWidth: '47%' },
  card: { borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  imageContainer: { width: '100%', position: 'relative', backgroundColor: '#E8E4F0' },
  favoriteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  soldText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  details: { padding: 10, gap: 2 },
  compactDetails: { padding: 8 },
  price: { fontSize: 15, fontWeight: '800' },
  compactPrice: { fontSize: 13 },
  title: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  compactTitle: { fontSize: 11, lineHeight: 14 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  distance: { fontSize: 10, flex: 1 },
});
