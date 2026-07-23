import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { ListingSummary, formatPrice } from '@/lib/hooks';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';

interface WebListingCardProps {
  item: ListingSummary;
}

function ListingImage({ uri, alt }: { uri: string; alt: string }) {
  const src = uri?.startsWith('http') ? uri : PLACEHOLDER;
  if (typeof document !== 'undefined') {
    return (
      // eslint-disable-next-line jsx-a11y/alt-text
      <img
        src={src}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = PLACEHOLDER;
        }}
      />
    );
  }
  return null;
}

export function WebListingCard({ item }: WebListingCardProps) {
  return (
    <Link href={`/listing/${item.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.imageWrap}>
          <ListingImage uri={item.image} alt={item.title} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.category}</Text>
          </View>
          {item.status === 'sold' && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldText}>SATILDI</Text>
            </View>
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText} numberOfLines={1}>
              {item.city ?? item.location ?? 'Türkiye'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E0F4',
    width: '100%',
  },
  imageWrap: { aspectRatio: 1, backgroundColor: '#EDE8F5', position: 'relative', overflow: 'hidden' },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(61, 26, 120, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: { color: '#FFF', fontWeight: '800', letterSpacing: 2, fontSize: 14 },
  body: { padding: 16, gap: 8 },
  price: { fontSize: 22, fontWeight: '800', color: '#3D1A78' },
  title: { fontSize: 15, fontWeight: '600', color: '#1A0A2E', lineHeight: 22 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaIcon: { fontSize: 11 },
  metaText: { fontSize: 12, color: '#7A6B8A', flex: 1 },
});
