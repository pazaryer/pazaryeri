import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { WEB_THEME } from '@/lib/web-theme';

const SLIDES = [
  {
    title: 'Ücretsiz ilan ver,\nhemen satışa başla!',
    subtitle: 'Komisyon yok — doğrudan alıcıyla mesajlaş',
    cta: 'İlan Ver',
    href: '/ilan-ver' as const,
    gradient: ['#5B8DEF', '#3D1A78'] as const,
  },
  {
    title: 'Güvenli ikinci el\nalışveriş',
    subtitle: 'Binlerce ilan tek tıkla keşfet',
    cta: 'Keşfet',
    href: '/kesfet' as const,
    gradient: ['#7B5FD4', '#3D1A78'] as const,
  },
];

export function WebHeroBanner() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const mobile = width < 640;
  const [active, setActive] = useState(0);
  const slide = SLIDES[active];

  const go = () => {
    const path = slide.href === '/ilan-ver' && !user ? '/kayit' : slide.href;
    router.push(path);
  };

  return (
    <View style={[styles.wrap, mobile && styles.wrapMobile]}>
      <View
        style={[
          styles.banner,
          mobile && styles.bannerMobile,
          { backgroundColor: slide.gradient[0] },
        ]}
      >
        <View style={styles.content}>
          <Text style={[styles.title, mobile && styles.titleMobile]}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          <Pressable style={styles.cta} onPress={go}>
            <Text style={styles.ctaText}>{slide.cta}</Text>
          </Pressable>
        </View>
        <View style={styles.deco}>
          <Text style={styles.decoEmoji}>{active === 0 ? '🛒' : '✨'}</Text>
        </View>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable
              key={i}
              style={[styles.dot, i === active && styles.dotActive]}
              onPress={() => setActive(i)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  wrapMobile: { paddingHorizontal: 12, paddingTop: 10 },
  banner: {
    maxWidth: WEB_THEME.maxWidth,
    width: '100%',
    alignSelf: 'center',
    borderRadius: WEB_THEME.radiusCard,
    padding: 28,
    minHeight: 160,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerMobile: { padding: 20, minHeight: 140, borderRadius: 14 },
  content: { flex: 1, gap: 8, zIndex: 1 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  titleMobile: { fontSize: 20, lineHeight: 26 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: WEB_THEME.radiusPill,
    marginTop: 4,
  },
  ctaText: { color: WEB_THEME.brand, fontWeight: '800', fontSize: 14 },
  deco: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  decoEmoji: { fontSize: 44 },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: '#FFFFFF', width: 18 },
});
