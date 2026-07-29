import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { adminFetch } from '@/lib/api';
import { Badge, Btn, Card, Input, Loading, Screen, Subtitle, Title } from '@/components/ui';
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
      body: JSON.stringify({
        title,
        price: Number(price),
        description,
      }),
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

  return (
    <Screen>
      <ScrollView>
        <Badge text={String(data.status)} tone={data.status === 'active' ? 'success' : 'default'} />
        {editMode ? (
          <>
            <Input value={title} onChangeText={setTitle} placeholder="Başlık" />
            <Input value={price} onChangeText={setPrice} placeholder="Fiyat" keyboardType="numeric" />
            <Input value={description} onChangeText={setDescription} placeholder="Açıklama" multiline />
            <Btn label="Kaydet" onPress={save} />
            <Btn label="İptal" variant="ghost" onPress={() => setEditMode(false)} />
          </>
        ) : (
          <>
            <Title>{String(data.title)}</Title>
            <Subtitle>{Number(data.price).toLocaleString('tr-TR')} ₺ · {String(data.category)}</Subtitle>
            <Card style={styles.card}>
              <Text style={styles.desc}>{String(data.description || '—')}</Text>
              <Text style={styles.meta}>
                {String(data.city ?? '')} {String(data.district ?? '')}
              </Text>
              <Text style={styles.meta}>
                Satıcı: {(data.seller as { name?: string })?.name ?? '—'}
              </Text>
            </Card>
            <Btn label="Düzenle" onPress={startEdit} />
          </>
        )}

        <Text style={styles.section}>Durum</Text>
        <Btn label="Aktif" variant="ghost" onPress={() => setStatus('active')} />
        <Btn label="Satıldı" variant="ghost" onPress={() => setStatus('sold')} />
        <Btn label="Rezerve" variant="ghost" onPress={() => setStatus('reserved')} />
        <Btn label="Sil" variant="danger" onPress={remove} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: SPACING.md },
  desc: { color: THEME.text, lineHeight: 22 },
  meta: { color: THEME.textMuted, fontSize: 12, marginTop: 8 },
  section: { color: THEME.gold, fontWeight: '700', marginVertical: SPACING.md },
});
