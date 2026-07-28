import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { ListingSummary, formatPrice } from '@/lib/hooks';
import { WebImage } from '@/components/WebImage';
import { WEB_THEME } from '@/lib/web-theme';

interface WebListingCardProps {
  item: ListingSummary;
}

export function WebListingCard({ item }: WebListingCardProps) {
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
        </View>
        <View style={styles.body}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.location} numberOfLines={1}>
            {item.city ?? item.district ?? item.location ?? 'Türkiye'}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

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
  body: { paddingTop: 8, paddingBottom: 4, gap: 2 },
  price: { fontSize: 15, fontWeight: '800', color: WEB_THEME.text },
  title: { fontSize: 13, fontWeight: '500', color: WEB_THEME.textMuted, lineHeight: 17 },
  location: { fontSize: 11, color: WEB_THEME.textLight, marginTop: 2 },
});
