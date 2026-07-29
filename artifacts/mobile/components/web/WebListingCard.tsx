import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { ListingSummary, formatPrice, useToggleFavorite } from '@/lib/hooks';
import { WebImage } from '@/components/WebImage';
import { WEB_THEME } from '@/lib/web-theme';
import { useAuth } from '@/contexts/AuthContext';

interface WebListingCardProps {
  item: ListingSummary;
}

export const WebListingCard = React.memo(function WebListingCard({ item }: WebListingCardProps) {
  const { user } = useAuth();
  const toggleFavorite = useToggleFavorite();

  const handleFavorite = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!user) return;
    toggleFavorite.mutate({ listingId: item.id, isFavorite: item.isFavorite });
  };

  return (
    <Link href={`/listing/${item.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.imageWrap}>
          <WebImage uri={item.image} alt={item.title} style={styles.image} />
          {item.status === 'sold' && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldText}>SATILDI</Text>
            </View>
          )}
          {item.favoriteCount > 0 && (
            <View style={styles.favBadge}>
              <Text style={styles.favBadgeText}>❤️ {item.favoriteCount}</Text>
            </View>
          )}
          {user && (
            <Pressable style={styles.favBtn} onPress={handleFavorite} hitSlop={6}>
              <Text style={styles.favIcon}>{item.isFavorite ? '❤️' : '🤍'}</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.location} numberOfLines={1}>
            {item.city ?? item.district ?? item.location ?? 'Türkiye'}
          </Text>
          {item.views > 0 && (
            <Text style={styles.views}>{item.views} görüntülenme</Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: WEB_THEME.surface,
    borderRadius: WEB_THEME.radius,
    overflow: 'hidden',
    width: '100%',
  },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: '#F0F0F0',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: WEB_THEME.radius,
  },
  image: { width: '100%', height: '100%' },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: WEB_THEME.radius,
  },
  soldText: { color: '#FFF', fontWeight: '800', letterSpacing: 2, fontSize: 13 },
  favBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  favBadgeText: { fontSize: 11, fontWeight: '700', color: WEB_THEME.textMuted },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favIcon: { fontSize: 16 },
  body: { paddingTop: 8, paddingBottom: 4, gap: 2 },
  price: { fontSize: 15, fontWeight: '800', color: WEB_THEME.text },
  title: { fontSize: 13, fontWeight: '500', color: WEB_THEME.textMuted, lineHeight: 17 },
  location: { fontSize: 11, color: WEB_THEME.textLight, marginTop: 2 },
  views: { fontSize: 10, color: WEB_THEME.textLight, marginTop: 2 },
});
