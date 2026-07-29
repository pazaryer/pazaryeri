import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { Badge, Btn, Card, Input, Loading } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { THEME, SPACING } from '@/lib/theme';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-listing', id],
    queryFn: () => adminFetch<Record<string, unknown>>(`/admin/listings/${id}`),
    enabled: !!id,
  });

  function startEdit() {
    setTitle(String(data?.title ?? ''));
    setPrice(String(data?.price ?? ''));
    setDescription(String(data?.description ?? ''));
    setEditMode(true);
  }

  async function save() {
    await adminFetch(`/admin/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, price: Number(price), description }),
    });
    setEditMode(false);
    refetch();
  }

  async function setStatus(status: string) {
    await adminFetch(`/admin/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    refetch();
  }

  async function remove() {
    Alert.alert('Sil', 'İlan kalıcı silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await adminFetch(`/admin/listings/${id}`, { method: 'DELETE' });
          Alert.alert('Silindi');
        },
      },
    ]);
  }

  if (isLoading || !data) return <Loading />;

  const seller = data.seller as { name?: string } | undefined;
  const subtitle = `${Number(data.price).toLocaleString('tr-TR')} ₺ · ${String(data.category)}`;

  return (
    <PageShell
      title={editMode ? 'İlan Düzenle' : String(data.title)}
      subtitle={editMode ? 'Değişiklikleri kaydedin' : subtitle}
      headerRight={
        !editMode ? (
          <Badge text={String(data.status)} tone={data.status === 'active' ? 'success' : 'default'} />
        ) : undefined
      }
    >
      {editMode ? (
        <Card style={styles.editCard}>
          <Input value={title} onChangeText={setTitle} placeholder="Başlık" />
          <Input value={price} onChangeText={setPrice} placeholder="Fiyat" keyboardType="numeric" />
          <Input value={description} onChangeText={setDescription} placeholder="Açıklama" multiline />
          <Btn label="Kaydet" variant="gold" onPress={save} />
          <Btn label="İptal" variant="ghost" onPress={() => setEditMode(false)} />
        </Card>
      ) : (
        <>
          <Card style={styles.card}>
            <Text style={styles.desc}>{String(data.description || '—')}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                📍 {String(data.city ?? '')} {String(data.district ?? '')}
              </Text>
              <Text style={styles.meta}>👤 Satıcı: {seller?.name ?? '—'}</Text>
            </View>
          </Card>
          <Btn label="Düzenle" variant="gold" onPress={startEdit} />
        </>
      )}

      <Section title="Durum Değiştir">
        <Btn label="Aktif" variant="ghost" onPress={() => setStatus('active')} />
        <Btn label="Satıldı" variant="ghost" onPress={() => setStatus('sold')} />
        <Btn label="Rezerve" variant="ghost" onPress={() => setStatus('reserved')} />
        <Btn label="Kalıcı Sil" variant="danger" onPress={remove} />
      </Section>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.md },
  editCard: { gap: SPACING.sm, marginBottom: SPACING.md },
  desc: { color: THEME.text, lineHeight: 24, fontSize: 15 },
  metaRow: { marginTop: SPACING.md, gap: 6 },
  meta: { color: THEME.textMuted, fontSize: 13 },
});
