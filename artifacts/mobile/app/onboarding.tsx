import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { setOnboardingComplete } from '@/lib/onboarding';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'welcome',
    emoji: '🛍️',
    title: 'Pazaryeri\'ye\nHoş Geldin',
    subtitle: 'Türkiye\'nin ikinci el alım-satım uygulaması. Ücretsiz ilan ver, hemen sat.',
    color: '#FF3B30',
  },
  {
    key: 'discover',
    emoji: '🔍',
    title: 'Keşfet,\nAl & Sat',
    subtitle: 'Telefon, araba, mobilya ve daha fazlası — yakınındaki ilanları anında gör.',
    color: '#3D1A78',
  },
  {
    key: 'permissions',
    emoji: '📍',
    title: 'Sana Özel\nDeneyim',
    subtitle: 'Yakınındaki ilanları görmek ve bildirim almak için izinleri aç.',
    color: '#FF3B30',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    try {
      await setOnboardingComplete();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
      if (Platform.OS !== 'web') {
        await Notifications.requestPermissionsAsync();
      }
    } catch {
      // kullanıcı reddedebilir
    }
    await finish();
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex(index + 1);
      return;
    }
    if (index === SLIDES.length - 1) {
      void requestPermissions();
    }
  };

  const skip = () => void finish();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.brand}>Pazaryeri</Text>
        <Pressable onPress={skip} hitSlop={12}>
          <Text style={styles.skip}>Atla</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
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
            <View style={[styles.emojiCircle, { backgroundColor: item.color + '18' }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            {item.key === 'permissions' && (
              <View style={styles.permList}>
                <View style={styles.permRow}>
                  <Ionicons name="location-outline" size={20} color="#FF3B30" />
                  <Text style={styles.permText}>Yakınındaki ilanları göster</Text>
                </View>
                <View style={styles.permRow}>
                  <Ionicons name="notifications-outline" size={20} color="#FF3B30" />
                  <Text style={styles.permText}>Mesaj ve teklif bildirimleri</Text>
                </View>
                <View style={styles.permRow}>
                  <Ionicons name="camera-outline" size={20} color="#FF3B30" />
                  <Text style={styles.permText}>İlan fotoğrafı çek & yükle</Text>
                </View>
              </View>
            )}
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable style={styles.cta} onPress={next} disabled={loading}>
          <Text style={styles.ctaText}>
            {loading ? '...' : index === SLIDES.length - 1 ? 'Başla' : 'Devam'}
          </Text>
          {!loading && <Ionicons name="arrow-forward" size={18} color="#FFF" />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  logo: { width: 36, height: 36, borderRadius: 10 },
  brand: { flex: 1, fontSize: 20, fontWeight: '900', color: '#FF3B30' },
  skip: { fontSize: 14, fontWeight: '600', color: '#717171' },
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
  emoji: { fontSize: 52 },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2C2C2C',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#717171',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  permList: { marginTop: 28, gap: 14, alignSelf: 'stretch', paddingHorizontal: 8 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  permText: { fontSize: 15, color: '#2C2C2C', fontWeight: '500' },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E0E0E0' },
  dotActive: { width: 20, backgroundColor: '#FF3B30' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 28,
  },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
