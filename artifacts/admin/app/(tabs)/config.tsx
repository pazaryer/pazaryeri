import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, FlatList, ScrollView, StyleSheet, Text } from 'react-native';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Btn, Card, Input, Loading, Screen, Subtitle, Title } from '@/components/ui';
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
      <Screen>
        <Title>{CONFIG_LABELS[selectedKey] ?? selectedKey}</Title>
        <Subtitle>JSON düzenleyici — web ve mobil uygulamayı uzaktan yönetir</Subtitle>
        <Input
          value={editJson}
          onChangeText={setEditJson}
          multiline
          style={styles.jsonInput}
          textAlignVertical="top"
        />
        <Btn label="Kaydet" onPress={saveConfig} />
        <Btn label="Varsayılana Dön" variant="ghost" onPress={resetConfig} />
        <Btn label="Geri" variant="ghost" onPress={() => setSelectedKey(null)} />
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <Title>Site & Uygulama CMS</Title>
      <Subtitle>Web sitesi ve mobil uygulamanın tüm içeriğini buradan yönetin</Subtitle>
      <FlatList
        data={data.keys}
        keyExtractor={(k) => k}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Text style={styles.keyTitle}>{CONFIG_LABELS[item] ?? item}</Text>
            <Text style={styles.keySub}>{item}</Text>
            <Btn label="Düzenle" variant="ghost" onPress={() => openEditor(item)} />
          </Card>
        )}
        ListFooterComponent={
          <ScrollView style={styles.preview}>
            <Text style={styles.previewTitle}>Önizleme (brand)</Text>
            <Text style={styles.previewJson}>
              {JSON.stringify(data.config.brand ?? data.defaults.brand, null, 2)}
            </Text>
          </ScrollView>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: SPACING.sm, gap: SPACING.sm },
  keyTitle: { color: THEME.text, fontWeight: '700', fontSize: 16 },
  keySub: { color: THEME.textMuted, fontSize: 11 },
  jsonInput: { minHeight: 280, fontFamily: 'monospace', fontSize: 12 },
  preview: { marginTop: SPACING.lg },
  previewTitle: { color: THEME.gold, fontWeight: '600', marginBottom: SPACING.sm },
  previewJson: { color: THEME.textMuted, fontSize: 11, fontFamily: 'monospace' },
});
