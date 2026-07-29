import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, Switch } from 'react-native';
import { adminFetch } from '@/lib/api';
import { Btn, Card, Input, Loading } from '@/components/ui';
import { PageShell } from '@/components/PageShell';
import { DataTable, CellText } from '@/components/DataTable';
import { THEME } from '@/lib/theme';

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
    <PageShell
      title="Kayan Yazılar"
      subtitle="Web ve mobil anasayfa duyuru bandı"
    >
      <Card style={styles.addBox}>
        <Input value={newText} onChangeText={setNewText} placeholder="Yeni duyuru metni..." />
        <Btn label="Ekle" variant="gold" onPress={addItem} />
      </Card>

      <DataTable
        columns={[
          { key: 'text', title: 'Metin', flex: 3 },
          { key: 'order', title: 'Sıra', width: 60 },
          { key: 'enabled', title: 'Aktif', width: 80 },
          { key: 'action', title: 'İşlem', width: 70 },
        ]}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        emptyMessage="Kayan yazı yok"
        renderCell={(item, col) => {
          if (col.key === 'text') {
            return (
              <CellText bold muted={!item.enabled}>
                {item.text}
              </CellText>
            );
          }
          if (col.key === 'order') return <CellText muted>{item.sort_order}</CellText>;
          if (col.key === 'enabled') {
            return (
              <Switch
                value={item.enabled}
                onValueChange={() => toggle(item)}
                trackColor={{ true: THEME.primary, false: THEME.border }}
              />
            );
          }
          return <Btn label="Sil" variant="danger" compact onPress={() => remove(item.id)} />;
        }}
      />
    </PageShell>
  );
}

const styles = StyleSheet.create({
  addBox: { marginBottom: 12, gap: 8 },
});
