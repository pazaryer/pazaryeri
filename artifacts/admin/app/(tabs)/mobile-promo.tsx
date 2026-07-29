import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Btn, Card, Input, Loading } from '@/components/ui';
import { SponsorBannerTable } from '@/components/SponsorBannerTable';
import { PageShell, Section } from '@/components/PageShell';
import { THEME, SPACING, RADIUS } from '@/lib/theme';

const SPONSOR_PLACEMENTS = [
  { id: 'home', label: 'Ana Sayfa' },
  { id: 'explore', label: 'Keşfet' },
  { id: 'post', label: 'İlan Ver' },
  { id: 'messages', label: 'Mesajlar' },
  { id: 'profile', label: 'Profil' },
  { id: 'listing', label: 'İlan Detay' },
  { id: 'web', label: 'Web Sitesi' },
] as const;

type SponsorPlacementId = (typeof SPONSOR_PLACEMENTS)[number]['id'];

type SponsorBannerForm = {
  placement: SponsorPlacementId;
  enabled: boolean;
  imageUrl: string;
  linkUrl: string;
  altText: string;
};

type MobilePromoForm = {
  developer: {
    enabled: boolean;
    signatureLabel: string;
    rateApp: {
      enabled: boolean;
      label: string;
      androidUrl: string;
      iosUrl: string;
      webUrl: string;
    };
    otherApps: {
      enabled: boolean;
      label: string;
      url: string;
    };
  };
  sponsorBanners: SponsorBannerForm[];
};

function emptySponsorBanners(): SponsorBannerForm[] {
  return SPONSOR_PLACEMENTS.map((p) => ({
    placement: p.id,
    enabled: false,
    imageUrl: '',
    linkUrl: '',
    altText: 'Sponsor',
  }));
}

function emptyForm(): MobilePromoForm {
  return {
    developer: {
      enabled: true,
      signatureLabel: 'dev/ByAltun',
      rateApp: {
        enabled: true,
        label: 'Uygulamayı Puanla & Yorumla',
        androidUrl: '',
        iosUrl: '',
        webUrl: '',
      },
      otherApps: {
        enabled: true,
        label: 'Yapımcının Diğer Uygulamaları',
        url: '',
      },
    },
    sponsorBanners: emptySponsorBanners(),
  };
}

function mergeSponsorBannersFromApi(
  raw: SponsorBannerForm[] | undefined,
  legacy?: { enabled: boolean; imageUrl: string | null; linkUrl: string | null; altText: string },
): SponsorBannerForm[] {
  const defaults = emptySponsorBanners();
  if (raw?.length) {
    return defaults.map((d) => {
      const found = raw.find((b) => b.placement === d.placement);
      if (!found) return d;
      return {
        placement: d.placement,
        enabled: found.enabled,
        imageUrl: found.imageUrl ?? '',
        linkUrl: found.linkUrl ?? '',
        altText: found.altText || 'Sponsor',
      };
    });
  }
  if (legacy) {
    return defaults.map((d) =>
      d.placement === 'home' || d.placement === 'web'
        ? {
            ...d,
            enabled: legacy.enabled,
            imageUrl: legacy.imageUrl ?? '',
            linkUrl: legacy.linkUrl ?? '',
            altText: legacy.altText,
          }
        : d,
    );
  }
  return defaults;
}

function updateSponsorBanner(
  banners: SponsorBannerForm[],
  placement: SponsorPlacementId,
  patch: Partial<SponsorBannerForm>,
): SponsorBannerForm[] {
  return banners.map((b) => (b.placement === placement ? { ...b, ...patch } : b));
}

function ToggleRow({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: THEME.primary, false: THEME.border }}
      />
    </View>
  );
}

export default function MobilePromoScreen() {
  const { profile } = useAuth();
  const [form, setForm] = useState<MobilePromoForm>(emptyForm());
  const [busy, setBusy] = useState(false);
  const [uploadingPlacement, setUploadingPlacement] = useState<SponsorPlacementId | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-mobile-promo'],
    queryFn: async () => {
      const res = await adminFetch<{
        promo: MobilePromoForm & { sponsorBanner?: SponsorBannerForm };
      }>('/admin/mobile-promo');
      const p = res.promo;
      setForm({
        developer: {
          enabled: p.developer.enabled,
          signatureLabel: p.developer.signatureLabel,
          rateApp: {
            enabled: p.developer.rateApp.enabled,
            label: p.developer.rateApp.label,
            androidUrl: p.developer.rateApp.androidUrl ?? '',
            iosUrl: p.developer.rateApp.iosUrl ?? '',
            webUrl: p.developer.rateApp.webUrl ?? '',
          },
          otherApps: {
            enabled: p.developer.otherApps.enabled,
            label: p.developer.otherApps.label,
            url: p.developer.otherApps.url ?? '',
          },
        },
        sponsorBanners: mergeSponsorBannersFromApi(
          p.sponsorBanners,
          p.sponsorBanner as { enabled: boolean; imageUrl: string | null; linkUrl: string | null; altText: string } | undefined,
        ),
      });
      return res;
    },
  });

  async function uploadBanner(placement: SponsorPlacementId) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin', 'Galeri erişimi gerekli');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.88,
      base64: true,
    });
    if (picked.canceled || !picked.assets[0]?.base64) return;

    setUploadingPlacement(placement);
    try {
      const asset = picked.assets[0]!;
      const res = await adminFetch<{ publicUrl: string }>('/admin/upload/brand-asset', {
        method: 'POST',
        body: JSON.stringify({
          contentType: asset.mimeType ?? 'image/jpeg',
          data: asset.base64,
        }),
      });
      setForm((f) => ({
        ...f,
        sponsorBanners: updateSponsorBanner(f.sponsorBanners, placement, { imageUrl: res.publicUrl }),
      }));
    } catch (e) {
      Alert.alert('Yükleme hatası', e instanceof Error ? e.message : 'Görsel yüklenemedi');
    } finally {
      setUploadingPlacement(null);
    }
  }

  function payload() {
    const sponsorBanners = form.sponsorBanners.map((b) => ({
      placement: b.placement,
      enabled: b.enabled,
      imageUrl: b.imageUrl.trim() || null,
      linkUrl: b.linkUrl.trim() || null,
      altText: b.altText.trim() || 'Sponsor',
    }));
    const home = sponsorBanners.find((b) => b.placement === 'home') ?? sponsorBanners[0];
    return {
      developer: {
        ...form.developer,
        rateApp: {
          ...form.developer.rateApp,
          androidUrl: form.developer.rateApp.androidUrl.trim() || null,
          iosUrl: form.developer.rateApp.iosUrl.trim() || null,
          webUrl: form.developer.rateApp.webUrl.trim() || null,
        },
        otherApps: {
          ...form.developer.otherApps,
          url: form.developer.otherApps.url.trim() || null,
        },
      },
      sponsorBanners,
      sponsorBanner: {
        enabled: home?.enabled ?? false,
        imageUrl: home?.imageUrl ?? null,
        linkUrl: home?.linkUrl ?? null,
        altText: home?.altText ?? 'Sponsor',
      },
    };
  }

  async function save() {
    if (profile?.role !== 'admin') {
      Alert.alert('Yetki', 'Değiştirmek için süper admin gerekli');
      return;
    }
    setBusy(true);
    try {
      await adminFetch('/admin/mobile-promo', {
        method: 'PUT',
        body: JSON.stringify(payload()),
      });
      Alert.alert('Kaydedildi', 'Ayarlar veritabanına kaydedildi.');
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
    const badBanner = form.sponsorBanners.find((b) => b.enabled && !b.imageUrl.trim());
    if (badBanner) {
      const label = SPONSOR_PLACEMENTS.find((p) => p.id === badBanner.placement)?.label ?? badBanner.placement;
      Alert.alert('Eksik görsel', `${label} banner açıkken bir görsel gerekli.`);
      return;
    }
    setBusy(true);
    try {
      await adminFetch('/admin/mobile-promo', {
        method: 'PUT',
        body: JSON.stringify(payload()),
      });
      const res = await adminFetch<{ message: string }>('/admin/mobile-promo/publish', {
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
      title="Mobil Promosyon"
      subtitle="Geliştirici imzası, puanla butonu, sponsor banner"
    >
      <Section title="Geliştirici İmzası">
        <Card>
          <ToggleRow
            label="İmza ve butonları göster"
            value={form.developer.enabled}
            onChange={(v) => setForm((f) => ({ ...f, developer: { ...f.developer, enabled: v } }))}
          />
          <Text style={styles.fieldLabel}>İmza metni</Text>
          <Input
            value={form.developer.signatureLabel}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, developer: { ...f.developer, signatureLabel: v } }))
            }
            placeholder="Dev / ByAltun"
          />
        </Card>
      </Section>

      <Section title="Uygulamayı Puanla">
        <Card>
          <ToggleRow
            label="Butonu göster"
            value={form.developer.rateApp.enabled}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                developer: {
                  ...f.developer,
                  rateApp: { ...f.developer.rateApp, enabled: v },
                },
              }))
            }
          />
          <Text style={styles.fieldLabel}>Buton metni</Text>
          <Input
            value={form.developer.rateApp.label}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                developer: { ...f.developer, rateApp: { ...f.developer.rateApp, label: v } },
              }))
            }
            placeholder="Uygulamayı Puanla & Yorumla"
          />
          <Text style={styles.fieldLabel}>Android (Play Store)</Text>
          <Input
            value={form.developer.rateApp.androidUrl}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                developer: { ...f.developer, rateApp: { ...f.developer.rateApp, androidUrl: v } },
              }))
            }
            placeholder="https://play.google.com/store/apps/details?id=..."
          />
          <Text style={styles.fieldLabel}>iOS (App Store)</Text>
          <Input
            value={form.developer.rateApp.iosUrl}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                developer: { ...f.developer, rateApp: { ...f.developer.rateApp, iosUrl: v } },
              }))
            }
            placeholder="https://apps.apple.com/..."
          />
          <Text style={styles.fieldLabel}>Web</Text>
          <Input
            value={form.developer.rateApp.webUrl}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                developer: { ...f.developer, rateApp: { ...f.developer.rateApp, webUrl: v } },
              }))
            }
            placeholder="https://play.google.com/store/apps/details?id=..."
          />
        </Card>
      </Section>

      <Section title="Diğer Uygulamalar">
        <Card>
          <ToggleRow
            label="Butonu göster"
            value={form.developer.otherApps.enabled}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                developer: {
                  ...f.developer,
                  otherApps: { ...f.developer.otherApps, enabled: v },
                },
              }))
            }
          />
          <Text style={styles.fieldLabel}>Buton metni</Text>
          <Input
            value={form.developer.otherApps.label}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                developer: { ...f.developer, otherApps: { ...f.developer.otherApps, label: v } },
              }))
            }
            placeholder="Yapımcının Diğer Uygulamaları"
          />
          <Text style={styles.fieldLabel}>Hedef link</Text>
          <Input
            value={form.developer.otherApps.url}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                developer: { ...f.developer, otherApps: { ...f.developer.otherApps, url: v } },
              }))
            }
            placeholder="https://play.google.com/store/apps/developer?id=By+Altun"
          />
        </Card>
      </Section>

      <Section title="Sponsor Bannerlar">
        <Text style={styles.hint}>
          Her sayfa için ayrı banner. Satıra dokunarak düzenleyin. Önerilen boyut: 320×50.
        </Text>
        <SponsorBannerTable
          rows={form.sponsorBanners.map((b) => ({
            ...b,
            label: SPONSOR_PLACEMENTS.find((p) => p.id === b.placement)?.label ?? b.placement,
          }))}
          onChange={(placement, patch) =>
            setForm((f) => ({
              ...f,
              sponsorBanners: updateSponsorBanner(f.sponsorBanners, placement as SponsorPlacementId, patch),
            }))
          }
          onUpload={uploadBanner}
          uploadingPlacement={uploadingPlacement}
          readOnly={profile?.role !== 'admin'}
        />
      </Section>

      <View style={styles.actions}>
        <Btn label="Kaydet" variant="ghost" onPress={save} disabled={busy} />
        <Btn label="Kaydet ve Yayınla" variant="gold" onPress={publish} disabled={busy} />
      </View>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  toggleText: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: THEME.text },
  toggleHint: { fontSize: 11, color: THEME.textMuted, marginTop: 2 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: THEME.textSoft, marginBottom: 6, marginTop: 8 },
  hint: { fontSize: 11, color: THEME.textMuted, lineHeight: 17, marginBottom: SPACING.sm },
  placementCard: { marginBottom: SPACING.md },
  placementTitle: { fontSize: 15, fontWeight: '800', color: THEME.primary, marginBottom: SPACING.sm },
  previewWrap: {
    width: '100%',
    aspectRatio: 320 / 50,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.card,
  },
  bannerPreview: {
    width: '100%',
    height: '100%',
  },
  previewBadge: {
    position: 'absolute',
    top: 4,
    left: 6,
    backgroundColor: THEME.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  bannerPlaceholder: {
    aspectRatio: 320 / 50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  bannerPlaceholderText: { color: THEME.textMuted, fontSize: 12 },
  uploadRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', marginBottom: SPACING.sm },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.xl },
});
