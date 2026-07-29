import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Btn, Card, Input, Loading } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { THEME, SPACING } from '@/lib/theme';

type BrandAssets = {
  iconUrl: string | null;
  logoUrl: string | null;
  splashUrl: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  adaptiveIconUrl: string | null;
};

type BrandingForm = {
  name: string;
  tagline: string;
  supportEmail: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryMid: string;
    primaryLight: string;
    gold: string;
    background: string;
  };
  assets: BrandAssets;
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
};

const ASSET_LABELS: { key: keyof BrandAssets; label: string; hint: string }[] = [
  { key: 'iconUrl', label: 'Uygulama İkonu', hint: '512×512 önerilir' },
  { key: 'logoUrl', label: 'Logo', hint: 'Header ve marka alanı' },
  { key: 'splashUrl', label: 'Splash / Açılış', hint: 'Açılış ekranı görseli' },
  { key: 'faviconUrl', label: 'Favicon', hint: 'Web sekme ikonu' },
  { key: 'ogImageUrl', label: 'OG / Paylaşım', hint: 'Sosyal medya önizleme' },
  { key: 'adaptiveIconUrl', label: 'Android Adaptive', hint: 'Android ana ekran' },
];

const COLOR_FIELDS: { key: keyof BrandingForm['colors']; label: string }[] = [
  { key: 'primary', label: 'Ana Renk' },
  { key: 'primaryDark', label: 'Koyu Mor' },
  { key: 'primaryMid', label: 'Orta Mor' },
  { key: 'primaryLight', label: 'Açık Mor' },
  { key: 'gold', label: 'Altın' },
  { key: 'background', label: 'Arka Plan' },
];

function emptyForm(): BrandingForm {
  return {
    name: '',
    tagline: '',
    supportEmail: '',
    colors: {
      primary: '#3D1A78',
      primaryDark: '#2A1260',
      primaryMid: '#5B3FA0',
      primaryLight: '#F4F1FA',
      gold: '#C9A84C',
      background: '#F7F5FC',
    },
    assets: {
      iconUrl: null,
      logoUrl: null,
      splashUrl: null,
      faviconUrl: null,
      ogImageUrl: null,
      adaptiveIconUrl: null,
    },
    seo: { title: '', description: '', keywords: '' },
  };
}

export default function BrandingScreen() {
  const { profile } = useAuth();
  const [form, setForm] = useState<BrandingForm>(emptyForm());
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-branding'],
    queryFn: async () => {
      const res = await adminFetch<{ branding: BrandingForm }>('/admin/branding');
      setForm(res.branding);
      return res;
    },
  });

  function setColor(key: keyof BrandingForm['colors'], value: string) {
    setForm((f) => ({ ...f, colors: { ...f.colors, [key]: value } }));
  }

  function setAsset(key: keyof BrandAssets, value: string | null) {
    setForm((f) => ({ ...f, assets: { ...f.assets, [key]: value } }));
  }

  async function uploadAsset(key: keyof BrandAssets) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin', 'Galeri erişimi gerekli');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
    });
    if (picked.canceled || !picked.assets[0]?.base64) return;

    setUploading(key);
    try {
      const asset = picked.assets[0]!;
      const res = await adminFetch<{ publicUrl: string }>('/admin/upload/brand-asset', {
        method: 'POST',
        body: JSON.stringify({
          contentType: asset.mimeType ?? 'image/jpeg',
          data: asset.base64,
        }),
      });
      setAsset(key, res.publicUrl);
    } catch (e) {
      Alert.alert('Yükleme hatası', e instanceof Error ? e.message : 'Görsel yüklenemedi');
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    if (profile?.role !== 'admin') {
      Alert.alert('Yetki', 'Marka değiştirmek için süper admin gerekli');
      return;
    }
    if (!form.name.trim()) {
      Alert.alert('Hata', 'Uygulama adı gerekli');
      return;
    }
    setBusy(true);
    try {
      await adminFetch('/admin/branding', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      Alert.alert('Kaydedildi', 'Marka ayarları veritabanına kaydedildi.');
      refetch();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kayıt başarısız');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (profile?.role !== 'admin') {
      Alert.alert('Yetki', 'Yayınlamak için süper admin gerekli');
      return;
    }
    setBusy(true);
    try {
      await adminFetch('/admin/branding', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const res = await adminFetch<{ message: string; publishedAt: string }>('/admin/branding/publish', {
        method: 'POST',
      });
      await adminFetch('/admin/publish', { method: 'POST' });
      Alert.alert('Yayınlandı', res.message);
      refetch();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Yayın başarısız');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading && !data) return <Loading />;

  return (
    <PageShell
      title="Marka & Kimlik"
      subtitle="Uygulama adı, logo, renkler, SEO — tam rebrand"
    >
      <Card style={styles.previewCard}>
        <View style={styles.previewRow}>
          {form.assets.iconUrl ? (
            <Image source={{ uri: form.assets.iconUrl }} style={styles.previewIcon} />
          ) : (
            <View style={[styles.previewIcon, styles.previewPlaceholder]}>
              <Text style={styles.previewPlaceholderText}>?</Text>
            </View>
          )}
          <View style={styles.previewText}>
            <Text style={[styles.previewName, { color: form.colors.primary }]}>
              {form.name || 'Uygulama Adı'}
            </Text>
            <Text style={styles.previewTag}>{form.tagline || 'Slogan'}</Text>
          </View>
        </View>
        <View style={styles.colorSwatches}>
          {Object.values(form.colors).map((c) => (
            <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
          ))}
        </View>
      </Card>

      <Section title="Temel Bilgiler">
        <Input
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="Uygulama / site adı"
        />
        <Input
          value={form.tagline}
          onChangeText={(v) => setForm((f) => ({ ...f, tagline: v }))}
          placeholder="Slogan"
        />
        <Input
          value={form.supportEmail}
          onChangeText={(v) => setForm((f) => ({ ...f, supportEmail: v }))}
          placeholder="Destek e-postası"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </Section>

      <Section title="Renkler">
        {COLOR_FIELDS.map(({ key, label }) => (
          <View key={key} style={styles.colorRow}>
            <View style={[styles.swatch, { backgroundColor: form.colors[key] }]} />
            <View style={styles.colorInput}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <Input
                value={form.colors[key]}
                onChangeText={(v) => setColor(key, v)}
                placeholder="#3D1A78"
                autoCapitalize="none"
              />
            </View>
          </View>
        ))}
      </Section>

      <Section title="Görseller">
        {ASSET_LABELS.map(({ key, label, hint }) => (
          <Card key={key} style={styles.assetCard}>
            <View style={styles.assetHead}>
              <View>
                <Text style={styles.assetTitle}>{label}</Text>
                <Text style={styles.assetHint}>{hint}</Text>
              </View>
              {form.assets[key] ? (
                <Image source={{ uri: form.assets[key]! }} style={styles.assetThumb} />
              ) : null}
            </View>
            <Input
              value={form.assets[key] ?? ''}
              onChangeText={(v) => setAsset(key, v.trim() || null)}
              placeholder="https://..."
              autoCapitalize="none"
            />
            <Btn
              label={uploading === key ? 'Yükleniyor...' : 'Galeriden Yükle'}
              variant="ghost"
              compact
              disabled={uploading === key}
              onPress={() => uploadAsset(key)}
            />
            {form.assets[key] ? (
              <Pressable onPress={() => setAsset(key, null)}>
                <Text style={styles.removeLink}>Görseli kaldır</Text>
              </Pressable>
            ) : null}
          </Card>
        ))}
      </Section>

      <Section title="SEO (Web)">
        <Input
          value={form.seo.title}
          onChangeText={(v) => setForm((f) => ({ ...f, seo: { ...f.seo, title: v } }))}
          placeholder="Sayfa başlığı"
        />
        <Input
          value={form.seo.description}
          onChangeText={(v) => setForm((f) => ({ ...f, seo: { ...f.seo, description: v } }))}
          placeholder="Meta açıklama"
          multiline
        />
        <Input
          value={form.seo.keywords}
          onChangeText={(v) => setForm((f) => ({ ...f, seo: { ...f.seo, keywords: v } }))}
          placeholder="Anahtar kelimeler"
        />
      </Section>

      <Section title="Yayınla">
        <Text style={styles.publishHint}>
          Kaydet ve Yayınla ile web ve mobil uygulama ~60 saniye içinde yeni markayı kullanır.
          Mağaza ikonu (App Store / Play Store) için ayrıca yeni APK/IPA build gerekir.
        </Text>
        <Btn label="Kaydet" variant="ghost" onPress={save} loading={busy} />
        <Btn label="Kaydet ve Yayınla" variant="gold" onPress={publish} loading={busy} />
      </Section>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  previewCard: { marginBottom: SPACING.md },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  previewIcon: { width: 64, height: 64, borderRadius: 16 },
  previewPlaceholder: {
    backgroundColor: THEME.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  previewPlaceholderText: { fontSize: 24, color: THEME.textMuted },
  previewText: { flex: 1 },
  previewName: { fontSize: 22, fontWeight: '800' },
  previewTag: { fontSize: 13, color: THEME.textMuted, marginTop: 4 },
  colorSwatches: { flexDirection: 'row', gap: 6, marginTop: SPACING.md },
  swatch: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: THEME.border },
  colorRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm, alignItems: 'flex-start' },
  colorInput: { flex: 1 },
  fieldLabel: { fontSize: 11, color: THEME.gold, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  assetCard: { marginBottom: SPACING.sm, gap: SPACING.sm },
  assetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assetTitle: { fontSize: 15, fontWeight: '700', color: THEME.text },
  assetHint: { fontSize: 11, color: THEME.textMuted, marginTop: 2 },
  assetThumb: { width: 48, height: 48, borderRadius: 10 },
  removeLink: { color: THEME.danger, fontSize: 12, textAlign: 'center' },
  publishHint: { color: THEME.textMuted, fontSize: 13, lineHeight: 20, marginBottom: SPACING.md },
});
