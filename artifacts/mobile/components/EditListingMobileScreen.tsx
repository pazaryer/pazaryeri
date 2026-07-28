import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useListing, useUpdateListing } from '@/lib/hooks';
import { pickImages } from '@/lib/storage';

const CATEGORIES = ['Elektronik', 'Araç', 'Mobilya', 'Moda', 'Spor', 'Ev', 'Hobi', 'Diğer'];

export default function EditListingMobileScreen({ listingId }: { listingId: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: listing, isLoading } = useListing(listingId);
  const updateListing = useUpdateListing();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!listing || prefilled) return;
    setTitle(listing.title);
    setPrice(String(listing.price));
    setCategory(listing.category);
    setDesc(listing.description ?? '');
    setLocation(listing.location ?? [listing.district, listing.city].filter(Boolean).join(', '));
    setImages(listing.images.length > 0 ? listing.images : listing.image ? [listing.image] : []);
    setPrefilled(true);
  }, [listing, prefilled]);

  const handlePickImages = async () => {
    try {
      const urls = await pickImages(10 - images.length);
      setImages((prev) => [...prev, ...urls].slice(0, 10));
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Fotoğraf yüklenemedi');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Hata', 'Başlık gerekli');
    if (!price.trim()) return Alert.alert('Hata', 'Fiyat gerekli');
    if (!category) return Alert.alert('Hata', 'Kategori seçin');
    if (images.length === 0) return Alert.alert('Hata', 'En az 1 fotoğraf ekleyin');

    setLoading(true);
    try {
      const parts = location.split(',').map((s) => s.trim());
      await updateListing.mutateAsync({
        id: listingId,
        title: title.trim(),
        price: parseInt(price.replace(/\D/g, ''), 10),
        category,
        description: desc.trim(),
        city: parts[1] ?? parts[0],
        district: parts[0],
        location,
        images,
      });
      Alert.alert('Başarılı', 'İlan güncellendi', [
        { text: 'Tamam', onPress: () => router.replace(`/listing/${listingId}`) },
      ]);
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'İlan güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !listing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>İlanı Düzenle</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        <Text style={[styles.label, { color: colors.foreground }]}>Fotoğraflar ({images.length}/10)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
          <Pressable style={[styles.photoBox, { borderColor: colors.border }]} onPress={handlePickImages}>
            <Ionicons name="images-outline" size={28} color={colors.mutedForeground} />
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
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Fiyat (₺)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Kategori</Text>
        <Pressable
          style={[styles.input, styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowCategories(!showCategories)}
        >
          <Text style={{ color: category ? colors.foreground : colors.mutedForeground }}>{category || 'Kategori Seçin'}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
        </Pressable>
        {showCategories && (
          <View style={[styles.categoryList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {CATEGORIES.map((cat) => (
              <Pressable key={cat} style={styles.categoryItem} onPress={() => { setCategory(cat); setShowCategories(false); }}>
                <Text style={{ color: colors.foreground }}>{cat}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={[styles.label, { color: colors.foreground }]}>Açıklama</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          multiline
          numberOfLines={4}
          value={desc}
          onChangeText={setDesc}
          textAlignVertical="top"
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Konum</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          value={location}
          onChangeText={setLocation}
        />

        <Pressable
          style={[styles.submitButton, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Kaydet</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
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
