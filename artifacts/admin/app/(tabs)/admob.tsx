import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Btn, Card, Input, Loading } from '@/components/ui';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { PageShell, Section } from '@/components/PageShell';
import { THEME, SPACING, RADIUS } from '@/lib/theme';

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
    testMode: true,
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

function StatusChip({ label, on }: { label: string; on: boolean }) {
  return (
    <View style={[styles.chip, on ? styles.chipOn : styles.chipOff]}>
      <View style={[styles.chipDot, { backgroundColor: on ? THEME.success : THEME.textMuted }]} />
      <Text style={[styles.chipText, on ? styles.chipTextOn : styles.chipTextOff]}>{label}</Text>
      <Text style={styles.chipState}>{on ? 'Açık' : 'Kapalı'}</Text>
    </View>
  );
}

function UnitFields({
  unit,
  onChange,
  disabled,
}: {
  unit: AdMobUnit;
  onChange: (u: AdMobUnit) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.fieldGrid, disabled && styles.disabledBlock]}>
      <Text style={styles.groupLabel}>Android</Text>
      <Text style={styles.cellLabel}>App ID</Text>
      <Input
        value={unit.androidAppId}
        onChangeText={(v) => onChange({ ...unit, androidAppId: v })}
        placeholder="ca-app-pub-xxx~yyy"
        autoCapitalize="none"
        editable={!disabled}
      />
      <Text style={styles.cellLabel}>Unit ID</Text>
      <Input
        value={unit.androidUnitId}
        onChangeText={(v) => onChange({ ...unit, androidUnitId: v })}
        placeholder="ca-app-pub-xxx/yyy"
        autoCapitalize="none"
        editable={!disabled}
      />
      <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>iOS</Text>
      <Text style={styles.cellLabel}>App ID</Text>
      <Input
        value={unit.iosAppId}
        onChangeText={(v) => onChange({ ...unit, iosAppId: v })}
        placeholder="ca-app-pub-xxx~yyy"
        autoCapitalize="none"
        editable={!disabled}
      />
      <Text style={styles.cellLabel}>Unit ID</Text>
      <Input
        value={unit.iosUnitId}
        onChangeText={(v) => onChange({ ...unit, iosUnitId: v })}
        placeholder="ca-app-pub-xxx/yyy"
        autoCapitalize="none"
        editable={!disabled}
      />
    </View>
  );
}

export default function AdMobScreen() {
  const { profile } = useAuth();
  const [form, setForm] = useState<AdMobForm>(emptyForm());
  const [defaults, setDefaults] = useState<AdMobForm | null>(null);
  const [busy, setBusy] = useState(false);
  const isSuperAdmin = profile?.role === 'admin';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-admob'],
    queryFn: async () => {
      const res = await adminFetch<{ admob: AdMobForm; defaults: AdMobForm }>('/admin/admob');
      setForm(res.admob);
      setDefaults(res.defaults);
      return res;
    },
  });

  const anyEnabled = form.banner.enabled || form.interstitial.enabled || form.rewarded.enabled;

  function setAllEnabled(enabled: boolean) {
    setForm((f) => ({
      ...f,
      banner: { ...f.banner, enabled },
      interstitial: { ...f.interstitial, enabled },
      rewarded: { ...f.rewarded, enabled },
    }));
  }

  function fillTestIds() {
    if (!defaults) return;
    setForm((f) => ({
      ...f,
      testMode: true,
      banner: { ...defaults.banner, enabled: f.banner.enabled },
      interstitial: {
        ...defaults.interstitial,
        enabled: f.interstitial.enabled,
        thirdSessionEnabled: f.interstitial.thirdSessionEnabled,
        afterSecondListingEnabled: f.interstitial.afterSecondListingEnabled,
        afterDeleteListingEnabled: f.interstitial.afterDeleteListingEnabled,
      },
      rewarded: { ...defaults.rewarded, enabled: f.rewarded.enabled, boostHours: f.rewarded.boostHours },
    }));
    Alert.alert('Test ID', 'Google test App/Unit ID değerleri dolduruldu. Test modu açıldı.');
  }

  async function save() {
    if (!isSuperAdmin) {
      Alert.alert('Yetki', 'Değiştirmek için süper admin gerekli');
      return;
    }
    setBusy(true);
    try {
      await adminFetch('/admin/admob', { method: 'PUT', body: JSON.stringify(form) });
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
      await adminFetch('/admin/admob', { method: 'PUT', body: JSON.stringify(form) });
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
    <PageShell
      title="AdMob Reklamları"
      subtitle="Banner, geçiş ve ödüllü reklamları buradan yönetin"
    >
      <Section title="Durum">
        <Card>
          <View style={styles.chipRow}>
            <StatusChip label="Banner" on={form.banner.enabled} />
            <StatusChip label="Geçiş" on={form.interstitial.enabled} />
            <StatusChip label="Ödüllü" on={form.rewarded.enabled} />
          </View>
          <Text style={styles.hint}>
            {form.testMode
              ? 'Test modu açık — Google test reklamları gösterilir.'
              : 'Canlı mod — kendi Unit ID’leriniz kullanılır.'}
          </Text>
        </Card>
      </Section>

      <Section title="Hızlı Kontroller">
        <Card>
          <ToggleRow
            label="Tüm reklamları aç / kapat"
            hint="Banner, geçiş ve ödüllü reklamı birlikte yönetir"
            value={anyEnabled}
            onChange={setAllEnabled}
          />
          <ToggleRow
            label="Test modu"
            hint="Açıkken Google test reklamları; kapalıyken canlı Unit ID’ler"
            value={form.testMode}
            onChange={(v) => setForm((f) => ({ ...f, testMode: v }))}
          />
          <Btn label="Google test ID'lerini doldur" variant="ghost" onPress={fillTestIds} />
        </Card>
      </Section>

      <CollapsibleSection
        title="Banner Reklamı"
        subtitle="Alt sabit banner — uygulama altında"
        defaultOpen
      >
        <ToggleRow
          label="Banner reklamı aktif"
          value={form.banner.enabled}
          onChange={(v) => setForm((f) => ({ ...f, banner: { ...f.banner, enabled: v } }))}
        />
        <UnitFields
          unit={form.banner}
          onChange={(banner) => setForm((f) => ({ ...f, banner }))}
          disabled={!form.banner.enabled && !form.testMode}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Geçiş Reklamı (Tam Ekran)"
        subtitle="Interstitial — belirli olaylarda tam ekran"
        defaultOpen
      >
        <ToggleRow
          label="Geçiş reklamı aktif"
          value={form.interstitial.enabled}
          onChange={(v) =>
            setForm((f) => ({ ...f, interstitial: { ...f.interstitial, enabled: v } }))
          }
        />
        <UnitFields
          unit={form.interstitial}
          onChange={(interstitial) =>
            setForm((f) => ({ ...f, interstitial: { ...f.interstitial, ...interstitial } }))
          }
          disabled={!form.interstitial.enabled && !form.testMode}
        />
        <View style={styles.divider} />
        <Text style={styles.subSectionTitle}>Ne zaman gösterilsin?</Text>
        <ToggleRow
          label="Günde 3. uygulama açılışı"
          value={form.interstitial.thirdSessionEnabled}
          onChange={(v) =>
            setForm((f) => ({
              ...f,
              interstitial: { ...f.interstitial, thirdSessionEnabled: v },
            }))
          }
        />
        <ToggleRow
          label="2. ilan verildikten sonra"
          value={form.interstitial.afterSecondListingEnabled}
          onChange={(v) =>
            setForm((f) => ({
              ...f,
              interstitial: { ...f.interstitial, afterSecondListingEnabled: v },
            }))
          }
        />
        <ToggleRow
          label="Kendi ilanı silinince"
          value={form.interstitial.afterDeleteListingEnabled}
          onChange={(v) =>
            setForm((f) => ({
              ...f,
              interstitial: { ...f.interstitial, afterDeleteListingEnabled: v },
            }))
          }
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Ödüllü Reklam"
        subtitle="İlan öne çıkarma için video izleme"
        defaultOpen
      >
        <ToggleRow
          label="Ödüllü reklam aktif"
          value={form.rewarded.enabled}
          onChange={(v) => setForm((f) => ({ ...f, rewarded: { ...f.rewarded, enabled: v } }))}
        />
        <UnitFields
          unit={form.rewarded}
          onChange={(rewarded) =>
            setForm((f) => ({ ...f, rewarded: { ...f.rewarded, ...rewarded } }))
          }
          disabled={!form.rewarded.enabled && !form.testMode}
        />
        <View style={styles.divider} />
        <Text style={styles.cellLabel}>Öne çıkarma süresi (saat)</Text>
        <Input
          value={String(form.rewarded.boostHours)}
          onChangeText={(v) =>
            setForm((f) => ({
              ...f,
              rewarded: {
                ...f.rewarded,
                boostHours: Math.min(24, Math.max(1, Number(v) || 2)),
              },
            }))
          }
          keyboardType="number-pad"
        />
      </CollapsibleSection>

      <View style={styles.actions}>
        <Btn label="Kaydet" variant="ghost" onPress={save} disabled={busy || !isSuperAdmin} />
        <Btn label="Kaydet ve Yayınla" variant="gold" onPress={publish} disabled={busy || !isSuperAdmin} />
      </View>
      {!isSuperAdmin ? (
        <Text style={styles.readOnlyHint}>Salt okunur — değişiklik için süper admin girişi gerekir.</Text>
      ) : null}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12, color: THEME.textMuted, lineHeight: 18, marginTop: SPACING.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipOn: { backgroundColor: THEME.successBg, borderColor: '#6EE7B7' },
  chipOff: { backgroundColor: THEME.bgSoft, borderColor: THEME.border },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontSize: 12, fontWeight: '700' },
  chipTextOn: { color: THEME.success },
  chipTextOff: { color: THEME.textMuted },
  chipState: { fontSize: 10, color: THEME.textSoft, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  toggleText: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: THEME.text },
  toggleHint: { fontSize: 11, color: THEME.textMuted, marginTop: 2, lineHeight: 16 },
  fieldGrid: { gap: 4 },
  disabledBlock: { opacity: 0.55 },
  groupLabel: { fontSize: 12, fontWeight: '800', color: THEME.primary, marginTop: 4 },
  groupLabelSpaced: { marginTop: SPACING.md },
  cellLabel: { fontSize: 11, fontWeight: '600', color: THEME.textSoft, marginBottom: 4, marginTop: 6 },
  subSectionTitle: { fontSize: 13, fontWeight: '800', color: THEME.text, marginBottom: SPACING.sm },
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: SPACING.md },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  readOnlyHint: {
    fontSize: 11,
    color: THEME.warning,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
});
