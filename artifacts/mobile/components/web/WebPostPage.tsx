import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { WebShell } from './WebShell';
import { WebPage } from './WebPage';
import { useCreateListing, useUpdateListing, useListing } from '@/lib/hooks';
import { pickImages } from '@/lib/storage';
import { showAlert } from '@/lib/web-alert';
import { useAuth } from '@/contexts/AuthContext';
import { LISTING_CATEGORIES } from '@/lib/categories';

const CATEGORIES = LISTING_CATEGORIES.filter((c) => c !== 'Tümü');

interface WebPostPageProps {
  editId?: string;
}

export function WebPostPage({ editId }: WebPostPageProps) {
  const router = useRouter();
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const { profile } = useAuth();
  const { data: existing, isLoading: loadingExisting } = useListing(editId ?? '');
  const isEdit = Boolean(editId);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  React.useEffect(() => {
    if (!isEdit || !existing || prefilled) return;
    setTitle(existing.title);
    setPrice(String(existing.price));
    setCategory(existing.category);
    setDesc(existing.description ?? '');
    setLocation(existing.location ?? [existing.district, existing.city].filter(Boolean).join(', '));
    setImages(existing.images.length > 0 ? existing.images : existing.image ? [existing.image] : []);
    setPrefilled(true);
  }, [isEdit, existing, prefilled]);

  const handlePickImages = async () => {
    setUploading(true);
    try {
      const urls = await pickImages(10 - images.length);
      if (urls.length > 0) {
        setImages((prev) => [...prev, ...urls].slice(0, 10));
      }
    } catch (e: any) {
      showAlert('Hata', e.message ?? 'Fotoğraf yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return showAlert('Hata', 'Başlık gerekli');
    if (!price.trim()) return showAlert('Hata', 'Fiyat gerekli');
    if (!category) return showAlert('Hata', 'Kategori seçin');
    if (!phone.trim()) return showAlert('Hata', 'İletişim telefonu gerekli');
    if (images.length === 0) return showAlert('Hata', 'En az 1 fotoğraf ekleyin');

    setLoading(true);
    try {
      const parts = location.split(',').map((s) => s.trim()).filter(Boolean);
      const payload = {
        title: title.trim(),
        price: parseInt(price.replace(/\D/g, ''), 10),
        category,
        description: desc.trim(),
        city: parts[1] ?? parts[0] ?? 'Türkiye',
        district: parts[0] ?? undefined,
        location: location.trim() || 'Türkiye',
        contactPhone: phone.trim(),
        images,
      };

      if (isEdit && editId) {
        await updateListing.mutateAsync({ id: editId, ...payload });
        showAlert('Başarılı', 'İlanınız güncellendi!');
        router.push(`/listing/${editId}`);
      } else {
        await createListing.mutateAsync(payload);
        showAlert('Başarılı', 'İlanınız yayınlandı!');
        router.push('/kesfet');
      }
    } catch (e: any) {
      showAlert('Hata', e.message ?? (isEdit ? 'İlan güncellenemedi' : 'İlan oluşturulamadı'));
    } finally {
      setLoading(false);
    }
  };

  if (isEdit && loadingExisting) {
    return (
      <WebShell hideFooter>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <ActivityIndicator size="large" color="#3D1A78" />
        </View>
      </WebShell>
    );
  }

  return (
    <WebShell hideFooter>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <WebPage title={isEdit ? 'İlanı Düzenle' : 'İlan Ver'} subtitle={isEdit ? 'İlan bilgilerinizi güncelleyin' : 'Ücretsiz ilanınızı dakikalar içinde yayınlayın'} narrow>
          <View style={styles.card}>
            <Text style={styles.label}>Fotoğraflar ({images.length}/10)</Text>
            <View style={styles.photoRow}>
              <Pressable
                style={[styles.photoBox, uploading && { opacity: 0.6 }]}
                onPress={handlePickImages}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#3D1A78" />
                ) : (
                  <>
                    <Text style={styles.photoBoxIcon}>🖼️</Text>
                    <Text style={styles.photoBoxText}>Fotoğraf Seç</Text>
                  </>
                )}
              </Pressable>
              {images.map((uri, i) => (
                <View key={i} style={styles.photoPreview}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <Pressable
                    style={styles.removePhoto}
                    onPress={() => setImages((p) => p.filter((_, j) => j !== i))}
                  >
                    <Text style={styles.removePhotoIcon}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Başlık</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: iPhone 14 Pro 256GB Siyah"
                  placeholderTextColor="#7A6B8A"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
              <View style={[styles.field, styles.fieldSmall]}>
                <Text style={styles.label}>Fiyat (₺)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#7A6B8A"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>

            <Text style={styles.label}>Kategori</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ürünün durumu, kullanım süresi vb."
              placeholderTextColor="#7A6B8A"
              multiline
              numberOfLines={5}
              value={desc}
              onChangeText={setDesc}
              textAlignVertical="top"
            />

            <Text style={styles.label}>İletişim Telefonu</Text>
            <TextInput
              style={styles.input}
              placeholder="05XX XXX XX XX"
              placeholderTextColor="#7A6B8A"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <Text style={styles.hint}>Alıcılar sizi arayabilir veya WhatsApp ile ulaşabilir</Text>

            <Text style={styles.label}>Konum</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Kadıköy, İstanbul"
              placeholderTextColor="#7A6B8A"
              value={location}
              onChangeText={setLocation}
            />

            <Pressable
              style={[styles.submit, (loading || uploading) && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading || uploading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitText}>{isEdit ? 'Değişiklikleri Kaydet' : 'İlanı Yayınla'}</Text>
              )}
            </Pressable>
          </View>
        </WebPage>
      </ScrollView>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 48 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E2D9F0',
    gap: 4,
  },
  label: { fontSize: 14, fontWeight: '700', color: '#1A0A2E', marginTop: 16, marginBottom: 8 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoBox: {
    width: 120,
    height: 120,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E2D9F0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F7F5FC',
  },
  photoBoxText: { fontSize: 12, color: '#7A6B8A', fontWeight: '600' },
  photoBoxIcon: { fontSize: 28 },
  photoPreview: { width: 120, height: 120, borderRadius: 14, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoIcon: { color: '#E8272C', fontSize: 14, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  field: { flex: 1, minWidth: 240 },
  fieldSmall: { flex: 0, minWidth: 160, maxWidth: 200 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E2D9F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A0A2E',
    backgroundColor: '#FFFFFF',
  },
  textArea: { height: 120, paddingTop: 14, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F0EBF8',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryChipActive: { backgroundColor: '#3D1A78', borderColor: '#3D1A78' },
  categoryChipText: { fontSize: 14, fontWeight: '600', color: '#3D1A78' },
  categoryChipTextActive: { color: '#FFFFFF' },
  hint: { fontSize: 12, color: '#7A6B8A', marginTop: -4, marginBottom: 4 },
  submit: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#3D1A78',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  submitText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});
