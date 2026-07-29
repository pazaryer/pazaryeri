import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { Btn, Card, EmptyState, Input, Loading, Screen, Subtitle, Title } from '@/components/ui';
import { THEME, SPACING } from '@/lib/theme';

interface MarqueeRow {
  id: string;
  text: string;
  enabled: boolean;
  sort_order: number;
}

export default function MarqueeScreen() {
  const [newText, setNewText] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-marquee'],
    queryFn: () => adminFetch<{ items: MarqueeRow[] }>('/admin/marquee'),
  });

  async function addItem() {
    if (!newText.trim()) return;
    await adminFetch('/admin/marquee', {
      method: 'POST',
      body: JSON.stringify({ text: newText.trim(), enabled: true }),
    });
    setNewText('');
    refetch();
  }

  async function toggle(item: MarqueeRow) {
    await adminFetch(`/admin/marquee/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: !item.enabled }),
    });
    refetch();
  }

  async function remove(id: string) {
    Alert.alert('Sil', 'Bu kayan yazı silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await adminFetch(`/admin/marquee/${id}`, { method: 'DELETE' });
          refetch();
        },
      },
    ]);
  }

  if (isLoading) return <Loading />;

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <Title>Kayan Yazılar</Title>
      <Subtitle>Web ve mobil anasayfadaki duyuru bandı — aç/kapat, düzenle, sil</Subtitle>

      <Card style={styles.addBox}>
        <Input value={newText} onChangeText={setNewText} placeholder="Yeni duyuru metni..." />
        <Btn label="Ekle" onPress={addItem} />
      </Card>

      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message="Kayan yazı yok" />}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={[styles.text, !item.enabled && styles.textOff]} numberOfLines={2}>
                {item.text}
              </Text>
              <Switch
                value={item.enabled}
                onValueChange={() => toggle(item)}
                trackColor={{ true: THEME.primary, false: THEME.border }}
              />
            </View>
            <Btn label="Sil" variant="danger" onPress={() => remove(item.id)} />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBox: { marginBottom: SPACING.md, gap: SPACING.sm },
  row: { marginBottom: SPACING.sm, gap: SPACING.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  text: { flex: 1, color: THEME.text, fontSize: 14 },
  textOff: { color: THEME.textMuted, textDecorationLine: 'line-through' },
});
