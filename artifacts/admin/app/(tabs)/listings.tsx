import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { adminFetch } from '@/lib/api';
import { Badge, Btn, Card, EmptyState, Input, Loading, Screen, Title } from '@/components/ui';
import { THEME, SPACING } from '@/lib/theme';

interface ListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
  status: string;
  city: string | null;
  seller: { name: string; email: string | null };
}

export default function ListingsScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-listings', q, status],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' });
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      return adminFetch<{ items: ListingRow[]; total: number }>(`/admin/listings?${params}`);
    },
  });

  async function deleteListing(id: string, title: string) {
    Alert.alert('İlanı Sil', `"${title}" kalıcı silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await adminFetch(`/admin/listings/${id}`, { method: 'DELETE' });
          refetch();
        },
      },
    ]);
  }

  if (isLoading) return <Loading />;

  const statuses = ['', 'active', 'sold', 'reserved'];

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <Title>İlanlar ({data?.total ?? 0})</Title>
      <Input value={q} onChangeText={setQ} placeholder="Başlık veya açıklama ara..." onSubmitEditing={() => refetch()} />
      <FlatList
        horizontal
        data={statuses}
        keyExtractor={(s) => s || 'all'}
        style={styles.statusRow}
        renderItem={({ item }) => (
          <Btn
            label={item || 'Tümü'}
            variant={status === item ? 'primary' : 'ghost'}
            onPress={() => setStatus(item)}
          />
        )}
      />
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message="İlan bulunamadı" />}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Pressable onPress={() => router.push(`/listing/${item.id}`)}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.sub}>
                {item.price.toLocaleString('tr-TR')} ₺ · {item.category}
                {item.city ? ` · ${item.city}` : ''}
              </Text>
              <Text style={styles.sub}>Satıcı: {item.seller?.name ?? '—'}</Text>
              <Badge text={item.status} tone={item.status === 'active' ? 'success' : 'default'} />
            </Pressable>
            <Btn label="Sil" variant="danger" onPress={() => deleteListing(item.id, item.title)} />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { maxHeight: 52, marginBottom: SPACING.sm },
  row: { marginBottom: SPACING.sm, gap: SPACING.sm },
  title: { color: THEME.text, fontWeight: '700', fontSize: 15 },
  sub: { color: THEME.textMuted, fontSize: 12, marginTop: 2 },
});
