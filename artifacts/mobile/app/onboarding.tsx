import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useBrand } from '@/contexts/BrandContext';
import { AppBrandMark } from '@/components/AppBrandMark';
import { AppIcon } from '@/components/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { setOnboardingComplete } from '@/lib/onboarding';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const brand = useBrand();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const slides = useMemo(
    () => [
      {
        key: 'welcome',
        emoji: '🛍️',
        title: `${brand.name}'ye\nHoş Geldin`,
        subtitle: brand.tagline || 'Ücretsiz ilan ver, hemen sat.',
        color: brand.primary,
      },
      {
        key: 'discover',
        emoji: '🔍',
        title: 'Keşfet,\nAl & Sat',
        subtitle: 'Telefon, araba, mobilya ve daha fazlası — yakınındaki ilanları anında gör.',
        color: brand.primaryMid,
      },
      {
        key: 'permissions',
        emoji: '📍',
        title: 'Sana Özel\nDeneyim',
        subtitle: 'Yakınındaki ilanları görmek ve bildirim almak için izinleri aç.',
        color: brand.gold,
      },
    ],
    [brand],
  );

  const finish = async () => {
    setLoading(true);
    try {
      await setOnboardingComplete();
      router.replace(user ? '/(tabs)' : '/login');
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
      if (Platform.OS !== 'web' && Constants.appOwnership !== 'expo') {
        const Notifications = await import('expo-notifications');
        await Notifications.requestPermissionsAsync();
      }
    } catch {
      /* kullanıcı reddedebilir */
    }
    await finish();
  };

  const next = () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex(index + 1);
      return;
    }
    if (index === slides.length - 1) {
      void requestPermissions();
    }
  };

  const skip = () => void finish();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: brand.background }]}>
      <View style={styles.topBar}>
        <AppBrandMark size="sm" />
        <Text style={[styles.brand, { color: brand.primary }]}>{brand.name}</Text>
        <Pressable onPress={skip} hitSlop={12}>
          <Text style={[styles.skip, { color: brand.textMuted }]}>Atla</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {item.key === 'welcome' ? (
              <AppIcon size="xl" variant="splash" style={styles.slideIcon} />
            ) : (
              <View style={[styles.emojiCircle, { backgroundColor: item.color + '18' }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
            )}
            <Text style={[styles.title, { color: brand.text }]}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: brand.textMuted }]}>{item.subtitle}</Text>
            {item.key === 'permissions' && (
              <View style={styles.permList}>
                <View style={styles.permRow}>
                  <Ionicons name="location-outline" size={20} color={brand.primary} />
                  <Text style={[styles.permText, { color: brand.text }]}>Yakınındaki ilanları göster</Text>
                </View>
                <View style={styles.permRow}>
                  <Ionicons name="notifications-outline" size={20} color={brand.primary} />
                  <Text style={[styles.permText, { color: brand.text }]}>Mesaj ve teklif bildirimleri</Text>
                </View>
                <View style={styles.permRow}>
                  <Ionicons name="camera-outline" size={20} color={brand.primary} />
                  <Text style={[styles.permText, { color: brand.text }]}>İlan fotoğrafı çek & yükle</Text>
                </View>
              </View>
            )}
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: brand.border },
                i === index && { width: 20, backgroundColor: brand.primary },
              ]}
            />
          ))}
        </View>
        <Pressable style={[styles.cta, { backgroundColor: brand.primary }]} onPress={next} disabled={loading}>
          <Text style={styles.ctaText}>
            {loading ? '...' : index === slides.length - 1 ? 'Başla' : 'Devam'}
          </Text>
          {!loading && <Ionicons name="arrow-forward" size={18} color="#FFF" />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  brand: { flex: 1, fontSize: 20, fontWeight: '800' },
  skip: { fontSize: 14, fontWeight: '600' },
  slide: {
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  emojiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  slideIcon: { marginBottom: 28 },
  emoji: { fontSize: 52 },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  permList: { marginTop: 28, gap: 14, alignSelf: 'stretch', paddingHorizontal: 8 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  permText: { fontSize: 15, fontWeight: '500' },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 28,
  },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
