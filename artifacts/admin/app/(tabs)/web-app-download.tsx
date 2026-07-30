import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Btn, Card, Input, Loading } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { THEME, SPACING } from '@/lib/theme';

type AppDownloadForm = {
  enabled: boolean;
  title: string;
  subtitle: string;
  buttonText: string;
  androidStoreUrl: string;
  iosStoreUrl: string;
  androidDeepLink: string;
  iosDeepLink: string;
  showOnDesktop: boolean;
};

function emptyForm(): AppDownloadForm {
  return {
    enabled: true,
    title: 'Mobil Uygulamamızı İndirin',
    subtitle: 'Daha hızlı ilan ver, anında mesajlaş',
    buttonText: 'Uygulamayı İndir',
    androidStoreUrl: '',
    iosStoreUrl: '',
    androidDeepLink: 'pazaryeri://',
    iosDeepLink: 'pazaryeri://',
    showOnDesktop: false,
  };
}

export default function WebAppDownloadScreen() {
  const { profile } = useAuth();
  const [form, setForm] = useState<AppDownloadForm>(emptyForm());
  const [busy, setBusy] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-web-app-download'],
    queryFn: async () => {
      const res = await adminFetch<{ appDownload: AppDownloadForm }>('/admin/web-app-download');
      setForm(res.appDownload);
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
      await adminFetch('/admin/web-app-download', { method: 'PUT', body: JSON.stringify(form) });
      Alert.alert('Kaydedildi', 'Web indirme butonu ayarları kaydedildi.');
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
      await adminFetch('/admin/web-app-download', { method: 'PUT', body: JSON.stringify(form) });
      const res = await adminFetch<{ message: string }>('/admin/web-app-download/publish', {
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
      showBack
      title="Web İndirme Butonu"
      subtitle="Yüzen mobil uygulama indirme CTA — yüklüyse gizlenir"
    >
      <Section title="Görünürlük">
        <Card>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Butonu göster</Text>
              <Text style={styles.toggleHint}>
                Kapalıyken web sitesinde yüzen buton çıkmaz
              </Text>
            </View>
            <Switch
              value={form.enabled}
              onValueChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
              trackColor={{ true: THEME.primary, false: THEME.border }}
            />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Masaüstünde de göster</Text>
              <Text style={styles.toggleHint}>Kapalıyken yalnızca mobil tarayıcıda görünür</Text>
            </View>
            <Switch
              value={form.showOnDesktop}
              onValueChange={(v) => setForm((f) => ({ ...f, showOnDesktop: v }))}
              trackColor={{ true: THEME.primary, false: THEME.border }}
            />
          </View>
        </Card>
      </Section>

      <Section title="Metinler">
        <Card>
          <Text style={styles.fieldLabel}>Başlık</Text>
          <Input value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
          <Text style={styles.fieldLabel}>Alt metin</Text>
          <Input value={form.subtitle} onChangeText={(v) => setForm((f) => ({ ...f, subtitle: v }))} />
          <Text style={styles.fieldLabel}>Buton metni</Text>
          <Input
            value={form.buttonText}
            onChangeText={(v) => setForm((f) => ({ ...f, buttonText: v }))}
          />
        </Card>
      </Section>

      <Section title="Mağaza Linkleri">
        <Card>
          <Text style={styles.fieldLabel}>Android (Play Store)</Text>
          <Input
            value={form.androidStoreUrl}
            onChangeText={(v) => setForm((f) => ({ ...f, androidStoreUrl: v }))}
            placeholder="https://play.google.com/store/apps/details?id=..."
            autoCapitalize="none"
          />
          <Text style={styles.fieldLabel}>iOS (App Store)</Text>
          <Input
            value={form.iosStoreUrl}
            onChangeText={(v) => setForm((f) => ({ ...f, iosStoreUrl: v }))}
            placeholder="https://apps.apple.com/app/id..."
            autoCapitalize="none"
          />
        </Card>
      </Section>

      <Section title="Derin Link (uygulama yüklüyse)">
        <Card>
          <Text style={styles.hint}>
            Kullanıcıda uygulama varsa bu link açılır ve buton gizlenir. Yoksa mağazaya yönlendirilir.
          </Text>
          <Text style={styles.fieldLabel}>Android deep link</Text>
          <Input
            value={form.androidDeepLink}
            onChangeText={(v) => setForm((f) => ({ ...f, androidDeepLink: v }))}
            placeholder="pazaryeri://"
            autoCapitalize="none"
          />
          <Text style={styles.fieldLabel}>iOS deep link</Text>
          <Input
            value={form.iosDeepLink}
            onChangeText={(v) => setForm((f) => ({ ...f, iosDeepLink: v }))}
            placeholder="pazaryeri://"
            autoCapitalize="none"
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
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.xl },
});
