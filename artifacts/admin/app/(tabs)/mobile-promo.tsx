import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Image,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Btn, Card, Input, Loading } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { THEME, SPACING, RADIUS } from '@/lib/theme';

type AdMobUnitForm = {
  enabled: boolean;
  androidAppId: string;
  iosAppId: string;
  androidUnitId: string;
  iosUnitId: string;
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
  sponsorBanner: {
    enabled: boolean;
    imageUrl: string;
    linkUrl: string;
    altText: string;
  };
  admob: {
    testMode: boolean;
    banner: AdMobUnitForm;
    interstitial: AdMobUnitForm & {
      thirdSessionEnabled: boolean;
      afterSecondListingEnabled: boolean;
      afterDeleteListingEnabled: boolean;
    };
    rewarded: AdMobUnitForm & {
      boostHours: number;
    };
  };
};

function emptyAdMobUnit(): AdMobUnitForm {
  return {
    enabled: false,
    androidAppId: '',
    iosAppId: '',
    androidUnitId: '',
    iosUnitId: '',
  };
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
    sponsorBanner: {
      enabled: false,
      imageUrl: '',
      linkUrl: '',
      altText: 'Sponsor',
    },
    admob: {
      testMode: true,
      banner: emptyAdMobUnit(),
      interstitial: {
        ...emptyAdMobUnit(),
        thirdSessionEnabled: true,
        afterSecondListingEnabled: true,
        afterDeleteListingEnabled: true,
      },
      rewarded: { ...emptyAdMobUnit(), boostHours: 2 },
    },
  };
}

function AdMobUnitFields({
  unit,
  onChange,
  title,
}: {
  title: string;
  unit: AdMobUnitForm;
  onChange: (unit: AdMobUnitForm) => void;
}) {
  return (
    <>
      <ToggleRow
        label={`${title} açık`}
        value={unit.enabled}
        onChange={(v) => onChange({ ...unit, enabled: v })}
      />
      <Text style={styles.fieldLabel}>Android App ID</Text>
      <Input
        value={unit.androidAppId}
        onChangeText={(v) => onChange({ ...unit, androidAppId: v })}
        placeholder="ca-app-pub-xxx~yyy"
        autoCapitalize="none"
      />
      <Text style={styles.fieldLabel}>iOS App ID</Text>
      <Input
        value={unit.iosAppId}
        onChangeText={(v) => onChange({ ...unit, iosAppId: v })}
        placeholder="ca-app-pub-xxx~yyy"
        autoCapitalize="none"
      />
      <Text style={styles.fieldLabel}>Android Unit ID</Text>
      <Input
        value={unit.androidUnitId}
        onChangeText={(v) => onChange({ ...unit, androidUnitId: v })}
        placeholder="ca-app-pub-xxx/yyy"
        autoCapitalize="none"
      />
      <Text style={styles.fieldLabel}>iOS Unit ID</Text>
      <Input
        value={unit.iosUnitId}
        onChangeText={(v) => onChange({ ...unit, iosUnitId: v })}
        placeholder="ca-app-pub-xxx/yyy"
        autoCapitalize="none"
      />
    </>
  );
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
  const [uploading, setUploading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-mobile-promo'],
    queryFn: async () => {
      const res = await adminFetch<{ promo: MobilePromoForm }>('/admin/mobile-promo');
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
        sponsorBanner: {
          enabled: p.sponsorBanner.enabled,
          imageUrl: p.sponsorBanner.imageUrl ?? '',
          linkUrl: p.sponsorBanner.linkUrl ?? '',
          altText: p.sponsorBanner.altText,
        },
        admob: {
          testMode: p.admob?.testMode ?? true,
          banner: {
            enabled: p.admob?.banner?.enabled ?? false,
            androidAppId: p.admob?.banner?.androidAppId ?? '',
            iosAppId: p.admob?.banner?.iosAppId ?? '',
            androidUnitId: p.admob?.banner?.androidUnitId ?? '',
            iosUnitId: p.admob?.banner?.iosUnitId ?? '',
          },
          interstitial: {
            enabled: p.admob?.interstitial?.enabled ?? false,
            androidAppId: p.admob?.interstitial?.androidAppId ?? '',
            iosAppId: p.admob?.interstitial?.iosAppId ?? '',
            androidUnitId: p.admob?.interstitial?.androidUnitId ?? '',
            iosUnitId: p.admob?.interstitial?.iosUnitId ?? '',
            thirdSessionEnabled: p.admob?.interstitial?.thirdSessionEnabled ?? true,
            afterSecondListingEnabled: p.admob?.interstitial?.afterSecondListingEnabled ?? true,
            afterDeleteListingEnabled: p.admob?.interstitial?.afterDeleteListingEnabled ?? true,
          },
          rewarded: {
            enabled: p.admob?.rewarded?.enabled ?? false,
            androidAppId: p.admob?.rewarded?.androidAppId ?? '',
            iosAppId: p.admob?.rewarded?.iosAppId ?? '',
            androidUnitId: p.admob?.rewarded?.androidUnitId ?? '',
            iosUnitId: p.admob?.rewarded?.iosUnitId ?? '',
            boostHours: p.admob?.rewarded?.boostHours ?? 2,
          },
        },
      });
      return res;
    },
  });

  async function uploadBanner() {
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

    setUploading(true);
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
        sponsorBanner: { ...f.sponsorBanner, imageUrl: res.publicUrl },
      }));
    } catch (e) {
      Alert.alert('Yükleme hatası', e instanceof Error ? e.message : 'Görsel yüklenemedi');
    } finally {
      setUploading(false);
    }
  }

  function payload() {
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
      sponsorBanner: {
        ...form.sponsorBanner,
        imageUrl: form.sponsorBanner.imageUrl.trim() || null,
        linkUrl: form.sponsorBanner.linkUrl.trim() || null,
      },
      admob: form.admob,
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
    if (form.sponsorBanner.enabled && !form.sponsorBanner.imageUrl.trim()) {
      Alert.alert('Eksik görsel', 'Banner açıkken bir görsel URL veya yüklenmiş dosya gerekli.');
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

      <Section title="Sponsor Banner">
        <Card>
          <Text style={styles.hint}>
            Önerilen boyut: 320×50 (AdMob standart) veya 728×90. Görsel banner alanına tam oturur.
          </Text>
          <ToggleRow
            label="Banner açık"
            hint="Kapalıyken hiçbir sayfada görünmez"
            value={form.sponsorBanner.enabled}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                sponsorBanner: { ...f.sponsorBanner, enabled: v },
              }))
            }
          />
          <Text style={styles.fieldLabel}>Tıklanınca gidilecek link</Text>
          <Input
            value={form.sponsorBanner.linkUrl}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                sponsorBanner: { ...f.sponsorBanner, linkUrl: v },
              }))
            }
            placeholder="https://..."
            autoCapitalize="none"
          />
          <Text style={styles.fieldLabel}>Banner görseli — link (URL)</Text>
          <Input
            value={form.sponsorBanner.imageUrl}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                sponsorBanner: { ...f.sponsorBanner, imageUrl: v },
              }))
            }
            placeholder="https://i.imgur.com/... veya ImgBB linki"
            autoCapitalize="none"
          />
          <Text style={styles.fieldLabel}>veya dosyadan yükle</Text>
          {form.sponsorBanner.imageUrl ? (
            <View style={styles.previewWrap}>
              <Image
                source={{ uri: form.sponsorBanner.imageUrl }}
                style={styles.bannerPreview}
                resizeMode="cover"
              />
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>SPONSOR</Text>
              </View>
            </View>
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Text style={styles.bannerPlaceholderText}>320 × 50 önizleme</Text>
            </View>
          )}
          <View style={styles.uploadRow}>
            <Btn
              label={uploading ? 'Yükleniyor…' : 'Galeriden Yükle'}
              variant="ghost"
              onPress={uploadBanner}
              disabled={uploading}
            />
            {form.sponsorBanner.imageUrl ? (
              <Btn
                label="Görseli Kaldır"
                variant="danger"
                compact
                onPress={() =>
                  setForm((f) => ({
                    ...f,
                    sponsorBanner: { ...f.sponsorBanner, imageUrl: '' },
                  }))
                }
              />
            ) : null}
          </View>
          <Text style={styles.fieldLabel}>Alt metin (erişilebilirlik)</Text>
          <Input
            value={form.sponsorBanner.altText}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                sponsorBanner: { ...f.sponsorBanner, altText: v },
              }))
            }
            placeholder="Sponsor"
          />
        </Card>
      </Section>

      <Section title="AdMob — Banner">
        <Card>
          <Text style={styles.hint}>
            Tab bar üstünde ince banner. Sponsor bannerın altında konumlanır. Tek istek — tüm sayfalarda aynı.
          </Text>
          <ToggleRow
            label="Test modu (Google test reklamları)"
            value={form.admob.testMode}
            onChange={(v) => setForm((f) => ({ ...f, admob: { ...f.admob, testMode: v } }))}
          />
          <AdMobUnitFields
            title="Banner"
            unit={form.admob.banner}
            onChange={(banner) => setForm((f) => ({ ...f, admob: { ...f.admob, banner } }))}
          />
        </Card>
      </Section>

      <Section title="AdMob — Geçiş Reklamı (Tam Ekran)">
        <Card>
          <AdMobUnitFields
            title="Geçiş"
            unit={form.admob.interstitial}
            onChange={(interstitial) =>
              setForm((f) => ({
                ...f,
                admob: { ...f.admob, interstitial: { ...f.admob.interstitial, ...interstitial } },
              }))
            }
          />
          <ToggleRow
            label="Günde 3. uygulama açılışında göster"
            value={form.admob.interstitial.thirdSessionEnabled}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                admob: { ...f.admob, interstitial: { ...f.admob.interstitial, thirdSessionEnabled: v } },
              }))
            }
          />
          <ToggleRow
            label="2. ilan verildikten sonra göster"
            value={form.admob.interstitial.afterSecondListingEnabled}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                admob: { ...f.admob, interstitial: { ...f.admob.interstitial, afterSecondListingEnabled: v } },
              }))
            }
          />
          <ToggleRow
            label="Kendi ilanı silinince göster"
            value={form.admob.interstitial.afterDeleteListingEnabled}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                admob: { ...f.admob, interstitial: { ...f.admob.interstitial, afterDeleteListingEnabled: v } },
              }))
            }
          />
        </Card>
      </Section>

      <Section title="AdMob — Ödüllü Reklam (Öne Çıkar)">
        <Card>
          <Text style={styles.hint}>
            Profil ve kendi ilan sayfasındaki “2 Saatliğine Öne Çıkar” butonu bu reklamı açar.
          </Text>
          <AdMobUnitFields
            title="Ödüllü"
            unit={form.admob.rewarded}
            onChange={(rewarded) =>
              setForm((f) => ({
                ...f,
                admob: { ...f.admob, rewarded: { ...f.admob.rewarded, ...rewarded } },
              }))
            }
          />
          <Text style={styles.fieldLabel}>Öne çıkarma süresi (saat)</Text>
          <Input
            value={String(form.admob.rewarded.boostHours)}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                admob: {
                  ...f.admob,
                  rewarded: { ...f.admob.rewarded, boostHours: Math.min(24, Math.max(1, Number(v) || 2)) },
                },
              }))
            }
            keyboardType="number-pad"
            placeholder="2"
          />
        </Card>
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
