import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useColors } from '@/hooks/useColors';
import { useCreateListing } from '@/lib/hooks';
import { pickImages, takePhoto } from '@/lib/storage';

const CATEGORIES = ['Elektronik', 'Araç', 'Mobilya', 'Moda', 'Spor', 'Ev', 'Hobi', 'Diğer'];

export default function PostScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const paddingTop = isWeb ? 67 : insets.top + 20;

  const createListing = useCreateListing();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const [loading, setLoading] = useState(false);

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
    const locStr = [geo?.district, geo?.city].filter(Boolean).join(', ');
    setLocation(locStr || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Hata', 'Başlık gerekli');
    if (!price.trim()) return Alert.alert('Hata', 'Fiyat gerekli');
    if (!category) return Alert.alert('Hata', 'Kategori seçin');
    if (images.length === 0) return Alert.alert('Hata', 'En az 1 fotoğraf ekleyin');

    setLoading(true);
    try {
      const parts = location.split(',').map((s) => s.trim());
      await createListing.mutateAsync({
        title: title.trim(),
        price: parseInt(price.replace(/\D/g, ''), 10),
        category,
        description: desc.trim(),
        city: parts[1] ?? parts[0],
        district: parts[0],
        location,
        images,
      });
      Alert.alert('Başarılı', 'İlanınız yayınlandı!', [
        { text: 'Tamam', onPress: () => router.push('/(tabs)') },
      ]);
      setTitle('');
      setPrice('');
      setCategory('');
      setDesc('');
      setLocation('');
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>İlan Ver</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}>
        <Text style={[styles.label, { color: colors.foreground }]}>Fotoğraflar ({images.length}/10)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
          <Pressable style={[styles.photoBox, { borderColor: colors.border }]} onPress={handlePickImages}>
            <Ionicons name="images-outline" size={28} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Galeri</Text>
          </Pressable>
          <Pressable style={[styles.photoBox, { borderColor: colors.border }]} onPress={handleTakePhoto}>
            <Ionicons name="camera-outline" size={28} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Kamera</Text>
          </Pressable>
          {images.map((uri, i) => (
            <View key={i} style={styles.photoPreview}>
              <Image source={{ uri }} style={styles.previewImage} />
              <Pressable style={styles.removePhoto} onPress={() => setImages((p) => p.filter((_, j) => j !== i))}>
                <Ionicons name="close-circle" size={22} color="#E8272C" />
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.foreground }]}>Başlık</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          placeholder="Örn: iPhone 14 Pro 256GB Siyah"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Fiyat (₺)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Kategori</Text>
        <Pressable
          style={[styles.input, styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowCategories(!showCategories)}
        >
          <Text style={{ color: category ? colors.foreground : colors.mutedForeground, fontSize: 16 }}>
            {category || 'Kategori Seçin'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
        </Pressable>
        {showCategories && (
          <View style={[styles.categoryList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={styles.categoryItem}
                onPress={() => { setCategory(cat); setShowCategories(false); }}
              >
                <Text style={{ color: colors.foreground }}>{cat}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={[styles.label, { color: colors.foreground }]}>Açıklama</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          placeholder="Ürünün durumu, kullanım süresi vb."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={4}
          value={desc}
          onChangeText={setDesc}
          textAlignVertical="top"
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Konum</Text>
        <Pressable
          style={[styles.input, styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleGetLocation}
        >
          <Text style={{ color: location ? colors.foreground : colors.mutedForeground, fontSize: 16, flex: 1 }}>
            {location || 'Konum Al'}
          </Text>
          <Ionicons name="location-outline" size={20} color={colors.mutedForeground} />
        </Pressable>

        <Pressable
          style={[styles.submitButton, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>İlanı Yayınla</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  photoRow: { flexDirection: 'row', marginBottom: 8 },
  photoBox: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    gap: 4,
  },
  photoPreview: { width: 90, height: 90, borderRadius: 12, marginRight: 10, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  removePhoto: { position: 'absolute', top: 2, right: 2 },
  input: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryList: { borderWidth: 1, borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  categoryItem: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  textArea: { height: 100, paddingTop: 16 },
  submitButton: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
