import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ListingSummary, formatPrice, useToggleFavorite } from '@/lib/hooks';

interface ListingCardProps {
  item: ListingSummary;
}

export function ListingCard({ item }: ListingCardProps) {
  const colors = useColors();
  const toggleFavorite = useToggleFavorite();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heights = [220, 190, 250, 280, 210, 240];
  const height = heights[parseInt(item.id.replace(/\D/g, '').slice(-1) || '0', 10) % heights.length];

  const handleFavorite = () => {
    toggleFavorite.mutate({ listingId: item.id, isFavorite: item.isFavorite });
  };

  return (
    <Link href={`/listing/${item.id}`} asChild>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={styles.cardContainer}
      >
        <Animated.View
          style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.foreground }, animatedStyle]}
        >
          <View style={[styles.imageContainer, { height }]}>
            <Image
              source={{ uri: item.image }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <Pressable style={styles.favoriteButton} onPress={(e) => { e.preventDefault(); handleFavorite(); }}>
              <View style={styles.favoriteCircle}>
                <Ionicons
                  name={item.isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={colors.accent}
                />
              </View>
            </Pressable>
            {item.status === 'sold' && (
              <View style={styles.soldOverlay}>
                <Text style={styles.soldText}>SATILDI</Text>
              </View>
            )}
          </View>

          <View style={styles.details}>
            <Text style={[styles.price, { color: colors.foreground }]}>{formatPrice(item.price)}</Text>
            <Text style={[styles.title, { color: colors.cardForeground }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-sharp" size={12} color={colors.accent} />
              <Text style={[styles.distance, { color: colors.mutedForeground }]}>
                {item.distance ?? item.location ?? item.city ?? 'Konum belirtilmemiş'}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  cardContainer: { flex: 1, margin: 6 },
  card: { borderRadius: 16, overflow: 'hidden', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  imageContainer: { width: '100%', position: 'relative', backgroundColor: '#E0E0E0' },
  categoryBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(61, 26, 120, 0.85)' },
  categoryText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  favoriteButton: { position: 'absolute', top: 8, right: 8 },
  favoriteCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.8)', justifyContent: 'center', alignItems: 'center' },
  soldOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  soldText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  details: { padding: 12 },
  price: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  title: { fontSize: 13, fontWeight: '600', letterSpacing: -0.2, lineHeight: 18, marginBottom: 8 },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  distance: { fontSize: 11, marginLeft: 4 },
});
