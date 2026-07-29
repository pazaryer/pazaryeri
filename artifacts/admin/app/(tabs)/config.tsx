import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet } from 'react-native';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Btn, Card, Input, Loading, MenuCard } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { THEME, SPACING } from '@/lib/theme';
const CONFIG_LABELS: Record<string, string> = {
  brand: 'Marka Renkleri',
  'web.seo': 'Web SEO',
  'web.announcements': 'Web Duyurular',
  'mobile.categories': 'Mobil Kategoriler',
  'mobile.featureFlags': 'Özellik Anahtarları',
  'mobile.app': 'Mobil Uygulama Ayarları',
};

export default function ConfigScreen() {
  const { profile } = useAuth();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editJson, setEditJson] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-config'],
    queryFn: () =>
      adminFetch<{ keys: string[]; config: Record<string, unknown>; defaults: Record<string, unknown> }>(
        '/admin/config',
      ),
  });

  function openEditor(key: string) {
    const value = data?.config[key] ?? data?.defaults[key];
    setSelectedKey(key);
    setEditJson(JSON.stringify(value, null, 2));
  }

  async function saveConfig() {
    if (!selectedKey) return;
    if (profile?.role !== 'admin') {
      Alert.alert('Yetki', 'Yapılandırma kaydetmek için süper admin gerekli');
      return;
    }
    try {
      const parsed = JSON.parse(editJson);
      await adminFetch(`/admin/config/${selectedKey}`, {
        method: 'PUT',
        body: JSON.stringify({ value: parsed }),
      });
      Alert.alert('Başarılı', 'Yapılandırma kaydedildi. Mobil ve web uygulaması güncellenecek.');
      setSelectedKey(null);
      refetch();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Geçersiz JSON');
    }
  }

  async function resetConfig() {
    if (!selectedKey || profile?.role !== 'admin') return;
    Alert.alert('Sıfırla', 'Varsayılan değere dönülsün mü?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sıfırla',
        style: 'destructive',
        onPress: async () => {
          await adminFetch(`/admin/config/${selectedKey}`, { method: 'DELETE' });
          setSelectedKey(null);
          refetch();
        },
      },
    ]);
  }

  if (isLoading || !data) return <Loading />;

  if (selectedKey) {
    return (
      <PageShell
        title={CONFIG_LABELS[selectedKey] ?? selectedKey}
        subtitle="JSON düzenleyici — web ve mobil uygulamayı uzaktan yönetir"
      >
        <Card>
          <Input
            value={editJson}
            onChangeText={setEditJson}
            multiline
            style={styles.jsonInput}
            textAlignVertical="top"
          />
        </Card>
        <Section title="Kaydet">
          <Btn label="Kaydet" variant="gold" onPress={saveConfig} />
          <Btn label="Varsayılana Dön" variant="ghost" onPress={resetConfig} />
          <Btn label="Geri" variant="ghost" onPress={() => setSelectedKey(null)} />
        </Section>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Site & Uygulama CMS"
      subtitle="Web sitesi ve mobil uygulamanın tüm içeriğini buradan yönetin"
    >
      <Section title="Yapılandırma Anahtarları">
        {data.keys.map((key) => (
          <MenuCard
            key={key}
            icon="⚙️"
            title={CONFIG_LABELS[key] ?? key}
            subtitle={key}
            onPress={() => openEditor(key)}
          />
        ))}
      </Section>

      <Section title="Önizleme (brand)">
        <Card>
          <Input
            value={JSON.stringify(data.config.brand ?? data.defaults.brand, null, 2)}
            editable={false}
            multiline
            style={styles.previewJson}
            textAlignVertical="top"
          />
        </Card>
      </Section>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  jsonInput: { minHeight: 320, fontFamily: 'monospace', fontSize: 12 },
  previewJson: { minHeight: 120, fontFamily: 'monospace', fontSize: 11, color: THEME.textMuted },
});
