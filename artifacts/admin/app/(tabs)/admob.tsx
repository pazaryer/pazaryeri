import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AdMobTable } from '@/components/AdMobTable';
import { Btn, Card, Input, Loading } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { THEME, SPACING } from '@/lib/theme';

type AdMobUnit = {
  enabled: boolean;
  androidAppId: string;
  iosAppId: string;
  androidUnitId: string;
  iosUnitId: string;
};

type AdMobForm = {
  testMode: boolean;
  banner: AdMobUnit;
  interstitial: AdMobUnit & {
    thirdSessionEnabled: boolean;
    afterSecondListingEnabled: boolean;
    afterDeleteListingEnabled: boolean;
  };
  rewarded: AdMobUnit & { boostHours: number };
};

function emptyUnit(): AdMobUnit {
  return { enabled: false, androidAppId: '', iosAppId: '', androidUnitId: '', iosUnitId: '' };
}

function emptyForm(): AdMobForm {
  return {
    testMode: false,
    banner: emptyUnit(),
    interstitial: {
      ...emptyUnit(),
      thirdSessionEnabled: true,
      afterSecondListingEnabled: true,
      afterDeleteListingEnabled: true,
    },
    rewarded: { ...emptyUnit(), boostHours: 2 },
  };
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
        thumbColor="#FFF"
      />
    </View>
  );
}

export default function AdMobScreen() {
  const { profile } = useAuth();
  const [form, setForm] = useState<AdMobForm>(emptyForm());
  const [busy, setBusy] = useState(false);
  const isSuperAdmin = profile?.role === 'admin';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-admob'],
    queryFn: async () => {
      const res = await adminFetch<{ admob: AdMobForm }>('/admin/admob');
      setForm(res.admob);
      return res;
    },
  });

  const tableRows = useMemo(
    () => [
      {
        key: 'banner',
        label: 'Banner',
        subtitle: 'Alt sabit',
        accent: '#6D28D9',
        ...form.banner,
      },
      {
        key: 'interstitial',
        label: 'Geçiş',
        subtitle: 'Tam ekran',
        accent: '#D97706',
        ...form.interstitial,
      },
      {
        key: 'rewarded',
        label: 'Ödüllü',
        subtitle: 'Video ödül',
        accent: '#059669',
        ...form.rewarded,
      },
    ],
    [form],
  );

  const anyEnabled = form.banner.enabled || form.interstitial.enabled || form.rewarded.enabled;

  function onTableChange(key: string, patch: Partial<AdMobUnit>) {
    if (key === 'banner') {
      setForm((f) => ({ ...f, banner: { ...f.banner, ...patch } }));
      return;
    }
    if (key === 'interstitial') {
      setForm((f) => ({ ...f, interstitial: { ...f.interstitial, ...patch } }));
      return;
    }
    if (key === 'rewarded') {
      setForm((f) => ({ ...f, rewarded: { ...f.rewarded, ...patch } }));
    }
  }

  function setAllEnabled(enabled: boolean) {
    setForm((f) => ({
      ...f,
      banner: { ...f.banner, enabled },
      interstitial: { ...f.interstitial, enabled },
      rewarded: { ...f.rewarded, enabled },
    }));
  }

  function admobPayload(): AdMobForm {
    return { ...form, testMode: false };
  }

  async function save() {
    if (!isSuperAdmin) {
      Alert.alert('Yetki', 'Değiştirmek için süper admin gerekli');
      return;
    }
    setBusy(true);
    try {
      await adminFetch('/admin/admob', { method: 'PUT', body: JSON.stringify(admobPayload()) });
      Alert.alert('Kaydedildi', 'AdMob ayarları kaydedildi.');
      refetch();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kayıt başarısız');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!isSuperAdmin) {
      Alert.alert('Yetki', 'Yayınlamak için süper admin gerekli');
      return;
    }
    setBusy(true);
    try {
      await adminFetch('/admin/admob', { method: 'PUT', body: JSON.stringify(admobPayload()) });
      const res = await adminFetch<{ message: string }>('/admin/admob/publish', { method: 'POST' });
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
    <PageShell showBack title="AdMob Reklamları" subtitle="Tablodan App ID ve Unit ID yönetimi">
      <Section title="Özet">
        <Card>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>
              Banner: <Text style={form.banner.enabled ? styles.on : styles.off}>{form.banner.enabled ? 'Açık' : 'Kapalı'}</Text>
            </Text>
            <Text style={styles.summaryItem}>
              Geçiş: <Text style={form.interstitial.enabled ? styles.on : styles.off}>{form.interstitial.enabled ? 'Açık' : 'Kapalı'}</Text>
            </Text>
            <Text style={styles.summaryItem}>
              Ödüllü: <Text style={form.rewarded.enabled ? styles.on : styles.off}>{form.rewarded.enabled ? 'Açık' : 'Kapalı'}</Text>
            </Text>
          </View>
          <Text style={styles.hint}>
            Gerçek App ID ve Unit ID&apos;leri girin. Reklamlar yalnızca yayınladıktan sonra mobil uygulamada görünür.
          </Text>
        </Card>
      </Section>

      <Section title="Hızlı Ayarlar">
        <Card>
          <ToggleRow
            label="Tüm reklamları aç / kapat"
            value={anyEnabled}
            onChange={setAllEnabled}
          />
        </Card>
      </Section>

      <Section title="Reklam Tablosu">
        <Text style={styles.tableHint}>Her satırda ayrı App ID ve Unit ID girin. Tabloyu yatay kaydırabilirsiniz.</Text>
        <AdMobTable rows={tableRows} onChange={onTableChange} readOnly={!isSuperAdmin} />
      </Section>

      <Section title="Geçiş Reklamı Tetikleyicileri">
        <Card>
          <ToggleRow
            label="Günde 3. uygulama açılışı"
            value={form.interstitial.thirdSessionEnabled}
            onChange={(v) =>
              setForm((f) => ({ ...f, interstitial: { ...f.interstitial, thirdSessionEnabled: v } }))
            }
          />
          <ToggleRow
            label="2. ilan verildikten sonra"
            value={form.interstitial.afterSecondListingEnabled}
            onChange={(v) =>
              setForm((f) => ({ ...f, interstitial: { ...f.interstitial, afterSecondListingEnabled: v } }))
            }
          />
          <ToggleRow
            label="Kendi ilanı silinince"
            value={form.interstitial.afterDeleteListingEnabled}
            onChange={(v) =>
              setForm((f) => ({ ...f, interstitial: { ...f.interstitial, afterDeleteListingEnabled: v } }))
            }
          />
        </Card>
      </Section>

      <Section title="Ödüllü Reklam">
        <Card>
          <Text style={styles.fieldLabel}>Öne çıkarma süresi (saat)</Text>
          <Input
            value={String(form.rewarded.boostHours)}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                rewarded: { ...f.rewarded, boostHours: Math.min(24, Math.max(1, Number(v) || 2)) },
              }))
            }
            keyboardType="number-pad"
          />
        </Card>
      </Section>

      <View style={styles.actions}>
        <Btn label="Kaydet" variant="ghost" onPress={save} disabled={busy || !isSuperAdmin} />
        <Btn label="Kaydet ve Yayınla" variant="gold" onPress={publish} disabled={busy || !isSuperAdmin} />
      </View>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12, color: THEME.textMuted, lineHeight: 18 },
  tableHint: { fontSize: 11, color: THEME.textMuted, marginBottom: SPACING.sm, lineHeight: 16 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.sm },
  summaryItem: { fontSize: 13, fontWeight: '600', color: THEME.textSoft },
  on: { color: THEME.success, fontWeight: '800' },
  off: { color: THEME.textMuted, fontWeight: '800' },
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
  fieldLabel: { fontSize: 12, fontWeight: '600', color: THEME.textSoft, marginBottom: 6 },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.xl },
});
