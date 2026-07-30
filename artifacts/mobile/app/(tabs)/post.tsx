import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateListing } from '@/lib/hooks';
import { pickImages, takePhoto } from '@/lib/storage';
import { LISTING_CATEGORIES, getCategoryIcon } from '@/lib/categories';
import { BRAND } from '@/constants/brand';
import {
  resolveListingCoords,
  formatGeocodedLocation,
  normalizeListingLocationParts,
  type ListingCoords,
} from '@/lib/listing-location';
import { SponsorBannerSlot } from '@/components/SponsorBannerSlot';
import { useAdBannerInset } from '@/hooks/useAdBannerInset';

const CATEGORIES = LISTING_CATEGORIES.filter((c) => c !== 'Tümü');

export default function PostScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { scrollPaddingBottom } = useAdBannerInset();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const paddingTop = isWeb ? 67 : insets.top;

  const createListing = useCreateListing();
  const { profile } = useAuth();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<ListingCoords>({});
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const filledSteps = [images.length > 0, !!title.trim(), !!price.trim(), !!category, !!phone.trim()].filter(Boolean).length;
  const progress = filledSteps / 5;

  const handlePickImages = async () => {
    try {
      const urls = await pickImages(10 - images.length);
      setImages((prev) => [...prev, ...urls].slice(0, 10));
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const url = await takePhoto();
      if (url) setImages((prev) => [...prev, url].slice(0, 10));
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Konum izni verilmedi');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const [geo] = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
    const locStr = formatGeocodedLocation(geo);
    setLocation(locStr || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
    setCoords({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Hata', 'Başlık gerekli');
    if (!price.trim()) return Alert.alert('Hata', 'Fiyat gerekli');
    if (!category) return Alert.alert('Hata', 'Kategori seçin');
    if (!phone.trim()) return Alert.alert('Hata', 'İletişim telefonu gerekli');
    if (images.length === 0) return Alert.alert('Hata', 'En az 1 fotoğraf ekleyin');

    setLoading(true);
    try {
      let submitCoords = coords;
      let submitLocation = location.trim();
      if (!submitLocation || submitCoords.latitude == null) {
        const device = await resolveListingCoords('', {});
        if (device.latitude != null && device.longitude != null) {
          submitCoords = device;
          if (!submitLocation) {
            const [geo] = await Location.reverseGeocodeAsync({
              latitude: device.latitude,
              longitude: device.longitude,
            });
            submitLocation = formatGeocodedLocation(geo);
          }
        }
      }

      const resolved = await resolveListingCoords(submitLocation, submitCoords);
      if (resolved.latitude == null || resolved.longitude == null) {
        Alert.alert('Konum gerekli', 'İlanınızın mesafe filtresinde görünmesi için konum izni verin veya konum alanına adres yazın.');
        return;
      }
      const locParts = normalizeListingLocationParts(submitLocation);
      const created = await createListing.mutateAsync({
        title: title.trim(),
        price: parseInt(price.replace(/\D/g, ''), 10),
        category,
        description: desc.trim(),
        city: locParts.city,
        district: locParts.district,
        location: locParts.location,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        contactPhone: phone.trim(),
        images,
      });
      Alert.alert('Başarılı', 'İlanınız yayınlandı!', [
        { text: 'İlanı Gör', onPress: () => router.push(`/listing/${created.id}`) },
        { text: 'Ana Sayfa', onPress: () => router.push('/(tabs)') },
      ]);
      if ((created.sellerListingCount ?? 0) >= 2) {
        setTimeout(() => {
          void import('@/lib/admob/interstitial').then((m) =>
            m.maybeShowListingInterstitial('second_listing'),
          );
        }, 600);
      }
      setTitle('');
      setPrice('');
      setCategory('');
      setDesc('');
      setLocation('');
      setCoords({});
      setPhone(profile?.phone ?? '');
      setImages([]);
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'İlan oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={paddingTop}
    >
      <LinearGradient
        colors={[BRAND.primary, BRAND.primaryDark]}
        style={[styles.header, { paddingTop: paddingTop + 8 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>İlan Ver</Text>
            <Text style={styles.headerSub}>Ücretsiz yayınla, hızlı sat</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={14} color={BRAND.gold} />
            <Text style={styles.badgeText}>Komisyonsuz</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: scrollPaddingBottom }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SponsorBannerSlot placement="post" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="images" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Fotoğraflar</Text>
            <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>{images.length}/10</Text>
          </View>
          <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>
            İlk fotoğraf kapak görseli olur. Net ve aydınlık çekimler daha çok ilgi çeker.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {images.length === 0 ? (
              <Pressable style={[styles.coverBox, { borderColor: colors.primary }]} onPress={handlePickImages}>
                <LinearGradient colors={[BRAND.primaryLight, '#FFF']} style={styles.coverGradient}>
                  <Ionicons name="camera" size={32} color={colors.primary} />
                  <Text style={[styles.coverText, { color: colors.primary }]}>Fotoğraf Ekle</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <>
                {images.map((uri, i) => (
                  <View key={uri} style={styles.photoPreview}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    {i === 0 && (
                      <View style={styles.coverTag}>
                        <Text style={styles.coverTagText}>Kapak</Text>
                      </View>
                    )}
                    <Pressable style={styles.removePhoto} onPress={() => setImages((p) => p.filter((_, j) => j !== i))}>
                      <Ionicons name="close-circle" size={22} color={BRAND.destructive} />
                    </Pressable>
                  </View>
                ))}
                {images.length < 10 && (
                  <Pressable style={[styles.addMoreBox, { borderColor: colors.border }]} onPress={handlePickImages}>
                    <Ionicons name="add" size={28} color={colors.primary} />
                  </Pressable>
                )}
              </>
            )}
          </ScrollView>
          <View style={styles.photoActions}>
            <Pressable style={[styles.actionChip, { backgroundColor: BRAND.primaryLight }]} onPress={handlePickImages}>
              <Ionicons name="images-outline" size={16} color={colors.primary} />
              <Text style={[styles.actionChipText, { color: colors.primary }]}>Galeri</Text>
            </Pressable>
            <Pressable style={[styles.actionChip, { backgroundColor: BRAND.primaryLight }]} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={16} color={colors.primary} />
              <Text style={[styles.actionChipText, { color: colors.primary }]}>Kamera</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="pricetag" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ürün Bilgileri</Text>
          </View>

          <Text style={[styles.label, { color: colors.foreground }]}>Başlık</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Örn: iPhone 14 Pro 256GB Siyah"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Fiyat (₺)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Kategori</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryChip,
                    { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? BRAND.primaryLight : colors.background },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Ionicons name={getCategoryIcon(cat)} size={14} color={active ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.categoryChipText, { color: active ? colors.primary : colors.foreground }]} numberOfLines={1}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.foreground }]}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Ürünün durumu, kullanım süresi, garanti bilgisi..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            value={desc}
            onChangeText={setDesc}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="call" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>İletişim & Konum</Text>
          </View>

          <Text style={[styles.label, { color: colors.foreground }]}>Telefon</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="05XX XXX XX XX"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Alıcılar sizi arayabilir veya WhatsApp ile ulaşabilir
          </Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Konum</Text>
          <Pressable
            style={[styles.input, styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={handleGetLocation}
          >
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={{ color: location ? colors.foreground : colors.mutedForeground, fontSize: 15, flex: 1 }} numberOfLines={1}>
              {location || 'Konumumu kullan'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Pressable
          style={[styles.submitButton, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient colors={[BRAND.primary, BRAND.primaryDark]} style={styles.submitGradient}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="rocket" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>İlanı Yayınla</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '500' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: { color: BRAND.goldLight, fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: BRAND.gold },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#1A0A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  cardMeta: { fontSize: 12, fontWeight: '600' },
  cardHint: { fontSize: 12, lineHeight: 17, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  photoRow: { gap: 10, paddingVertical: 4 },
  coverBox: {
    width: 160,
    height: 120,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  coverGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  coverText: { fontSize: 13, fontWeight: '700' },
  photoPreview: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  coverTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: BRAND.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coverTagText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  removePhoto: { position: 'absolute', top: 4, right: 4 },
  addMoreBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionChipText: { fontSize: 13, fontWeight: '700' },
  input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: '48%',
  },
  categoryChipText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  textArea: { height: 96, paddingTop: 12 },
  hint: { fontSize: 11, marginTop: 4 },
  submitButton: { borderRadius: 16, overflow: 'hidden', marginTop: 6 },
  submitGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
