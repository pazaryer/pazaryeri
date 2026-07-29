import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Btn, Card, Input, Loading } from '@/components/ui';
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
      <Switch value={value} onValueChange={onChange} trackColor={{ true: THEME.primary, false: THEME.border }} />
    </View>
  );
}

function UnitTableRow({
  label,
  icon,
  unit,
  onChange,
  accent,
}: {
  label: string;
  icon: string;
  unit: AdMobUnit;
  onChange: (u: AdMobUnit) => void;
  accent: string;
}) {
  return (
    <View style={[styles.tableRow, { borderLeftColor: accent }]}>
      <View style={styles.rowHead}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={styles.rowTitle}>{label}</Text>
        <Switch
          value={unit.enabled}
          onValueChange={(v) => onChange({ ...unit, enabled: v })}
          trackColor={{ true: THEME.primary, false: THEME.border }}
        />
      </View>
      <View style={styles.fieldGrid}>
        <View style={styles.fieldCell}>
          <Text style={styles.cellLabel}>Android App ID</Text>
          <Input
            value={unit.androidAppId}
            onChangeText={(v) => onChange({ ...unit, androidAppId: v })}
            placeholder="ca-app-pub-xxx~yyy"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.fieldCell}>
          <Text style={styles.cellLabel}>iOS App ID</Text>
          <Input
            value={unit.iosAppId}
            onChangeText={(v) => onChange({ ...unit, iosAppId: v })}
            placeholder="ca-app-pub-xxx~yyy"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.fieldCell}>
          <Text style={styles.cellLabel}>Android Unit ID</Text>
          <Input
            value={unit.androidUnitId}
            onChangeText={(v) => onChange({ ...unit, androidUnitId: v })}
            placeholder="ca-app-pub-xxx/yyy"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.fieldCell}>
          <Text style={styles.cellLabel}>iOS Unit ID</Text>
          <Input
            value={unit.iosUnitId}
            onChangeText={(v) => onChange({ ...unit, iosUnitId: v })}
            placeholder="ca-app-pub-xxx/yyy"
            autoCapitalize="none"
          />
        </View>
      </View>
    </View>
  );
}

export default function AdMobScreen() {
  const { profile } = useAuth();
  const [form, setForm] = useState<AdMobForm>(emptyForm());
  const [busy, setBusy] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-admob'],
    queryFn: async () => {
      const res = await adminFetch<{ admob: AdMobForm }>('/admin/admob');
      setForm(res.admob);
      return res;
    },
  });

  async function save() {
    if (profile?.role !== 'admin') {
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
    if (profile?.role !== 'admin') {
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
    <PageShell title="AdMob Reklamları" subtitle="Banner, geçiş ve ödüllü reklam kimlikleri">
      <Section title="Genel">
        <Card>
          <ToggleRow
            label="Test modu"
            hint="Açıkken Google test reklamları gösterilir"
            value={form.testMode}
            onChange={(v) => setForm((f) => ({ ...f, testMode: v }))}
          />
        </Card>
      </Section>

      <Section title="Reklam Tablosu">
        <Card>
          <Text style={styles.hint}>
            Her satır bağımsız App ID ve Unit ID kullanır. İstediğiniz AdMob hesabı kimliklerini yazın.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableWrap}>
              <UnitTableRow
                label="Banner"
                icon="▬"
                accent="#5B3FA0"
                unit={form.banner}
                onChange={(banner) => setForm((f) => ({ ...f, banner }))}
              />
              <UnitTableRow
                label="Geçiş (Tam Ekran)"
                icon="⛶"
                accent="#C9A84C"
                unit={form.interstitial}
                onChange={(interstitial) =>
                  setForm((f) => ({ ...f, interstitial: { ...f.interstitial, ...interstitial } }))
                }
              />
              <UnitTableRow
                label="Ödüllü"
                icon="★"
                accent="#2E7D32"
                unit={form.rewarded}
                onChange={(rewarded) =>
                  setForm((f) => ({ ...f, rewarded: { ...f.rewarded, ...rewarded } }))
                }
              />
            </View>
          </ScrollView>
        </Card>
      </Section>

      <Section title="Geçiş Reklamı Tetikleyicileri">
        <Card>
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
                rewarded: {
                  ...f.rewarded,
                  boostHours: Math.min(24, Math.max(1, Number(v) || 2)),
                },
              }))
            }
            keyboardType="number-pad"
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
  hint: { fontSize: 11, color: THEME.textMuted, lineHeight: 17, marginBottom: SPACING.sm },
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
  tableWrap: { minWidth: 320, gap: SPACING.md, paddingBottom: 4 },
  tableRow: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderLeftWidth: 4,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    backgroundColor: THEME.card,
    marginBottom: SPACING.sm,
  },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  rowIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: THEME.text },
  fieldGrid: { gap: SPACING.sm },
  fieldCell: { minWidth: 280 },
  cellLabel: { fontSize: 11, fontWeight: '600', color: THEME.textSoft, marginBottom: 4 },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.xl },
});
