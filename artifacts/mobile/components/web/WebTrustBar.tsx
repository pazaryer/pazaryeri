import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

function CubeIcon() {
  return (
    <View style={cubeStyles.stack}>
      <View style={[cubeStyles.cube, cubeStyles.back]} />
      <View style={[cubeStyles.cube, cubeStyles.front]}>
        <Text style={cubeStyles.icon}>🛒</Text>
      </View>
    </View>
  );
}

const cubeStyles = StyleSheet.create({
  stack: { width: 40, height: 36, position: 'relative', flexShrink: 0 },
  cube: { position: 'absolute', width: 28, height: 28, borderRadius: 7, borderWidth: 1.5 },
  back: {
    backgroundColor: '#EDE8F5',
    borderColor: '#E8E0F4',
    top: 0,
    left: 0,
    opacity: 0.7,
  },
  front: {
    backgroundColor: '#3D1A78',
    borderColor: '#C9A84C',
    top: 6,
    left: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 14 },
});

export function WebTrustBar() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, wide && styles.barWide]}>
        <CubeIcon />
        <View style={styles.textBlock}>
          <Text style={styles.brand}>Pazaryeri</Text>
          <Text style={styles.tagline}>
            Türkiye'nin güvenilir ikinci el alım-satım platformu — ücretsiz ilan ver, al ve sat.
          </Text>
        </View>
        <Pressable
          style={styles.cta}
          onPress={() => router.push(user ? '/ilan-ver' : '/kayit')}
        >
          <Text style={styles.ctaText}>+ İlan Ver</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  bar: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2D9F0',
    padding: 12,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  barWide: { paddingHorizontal: 16, paddingVertical: 14 },
  textBlock: { flex: 1, gap: 2, minWidth: 0 },
  brand: { fontSize: 15, fontWeight: '900', color: '#1A0A2E' },
  tagline: { fontSize: 12, color: '#7A6B8A', fontWeight: '500', lineHeight: 17 },
  cta: {
    backgroundColor: '#3D1A78',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9,
    flexShrink: 0,
  },
  ctaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
});
