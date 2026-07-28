import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';

function CubeIcon({ small }: { small?: boolean }) {
  const size = small ? 22 : 28;
  return (
    <View style={[cubeStyles.stack, small && { width: 32, height: 30 }]}>
      <View style={[cubeStyles.cube, cubeStyles.back, { width: size, height: size }]} />
      <View style={[cubeStyles.cube, cubeStyles.front, { width: size, height: size, top: small ? 4 : 6, left: small ? 8 : 10 }]}>
        <Text style={[cubeStyles.icon, small && { fontSize: 12 }]}>🛒</Text>
      </View>
    </View>
  );
}

const cubeStyles = StyleSheet.create({
  stack: { width: 40, height: 36, position: 'relative', flexShrink: 0 },
  cube: { position: 'absolute', borderRadius: 7, borderWidth: 1.5 },
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 14 },
});

export function WebTrustBar() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const mobileWeb = useIsMobileWeb();
  const wide = width >= 768;

  return (
    <View style={[styles.wrap, mobileWeb && styles.wrapMobile]}>
      <View style={[styles.bar, wide && styles.barWide, mobileWeb && styles.barMobile]}>
        <CubeIcon small={mobileWeb} />
        <View style={styles.textBlock}>
          <Text style={[styles.brand, mobileWeb && styles.brandMobile]}>Pazaryeri</Text>
          <Text style={[styles.tagline, mobileWeb && styles.taglineMobile]} numberOfLines={mobileWeb ? 2 : undefined}>
            Türkiye'nin güvenilir ikinci el alım-satım platformu — ücretsiz ilan ver, al ve sat.
          </Text>
        </View>
        {!mobileWeb && (
          <Pressable style={styles.cta} onPress={() => router.push(user ? '/ilan-ver' : '/kayit')}>
            <Text style={styles.ctaText}>+ İlan Ver</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  wrapMobile: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 0 },
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
  barMobile: { padding: 10, gap: 8, borderRadius: 10 },
  textBlock: { flex: 1, gap: 2, minWidth: 0 },
  brand: { fontSize: 15, fontWeight: '900', color: '#1A0A2E' },
  brandMobile: { fontSize: 14 },
  tagline: { fontSize: 12, color: '#7A6B8A', fontWeight: '500', lineHeight: 17 },
  taglineMobile: { fontSize: 11, lineHeight: 15 },
  cta: {
    backgroundColor: '#3D1A78',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9,
    flexShrink: 0,
  },
  ctaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
});
