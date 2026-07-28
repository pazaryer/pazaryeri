import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Link } from 'expo-router';
import { ListingSummary, formatPrice } from '@/lib/hooks';
import { WebImage, resolveImageUri } from '@/components/WebImage';

interface WebListingCardProps {
  item: ListingSummary;
}

export function WebListingCard({ item }: WebListingCardProps) {
  const [failed, setFailed] = useState(false);
  const src = failed ? resolveImageUri(null) : resolveImageUri(item.image);

  return (
    <Link href={`/listing/${item.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.imageWrap}>
          {Platform.OS === 'web' && typeof document !== 'undefined' ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img
              src={src}
              alt={item.title}
              onError={() => setFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <WebImage uri={item.image} alt={item.title} style={styles.image} />
          )}
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
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
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
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E0F4',
    width: '100%',
  },
  imageWrap: { aspectRatio: 4 / 3, backgroundColor: '#EDE8F5', position: 'relative', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(61, 26, 120, 0.9)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: { color: '#FFF', fontWeight: '800', letterSpacing: 2, fontSize: 14 },
  body: { padding: 10, gap: 4 },
  price: { fontSize: 16, fontWeight: '800', color: '#3D1A78' },
  title: { fontSize: 13, fontWeight: '600', color: '#1A0A2E', lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaIcon: { fontSize: 11 },
  metaText: { fontSize: 12, color: '#7A6B8A', flex: 1 },
});
