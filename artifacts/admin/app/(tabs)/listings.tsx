import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { adminFetch } from '@/lib/api';
import { Badge, Btn, Chip, Loading, SearchInput } from '@/components/ui';
import { PageShell, FilterRow } from '@/components/PageShell';
import { DataTable, CellText } from '@/components/DataTable';

interface ListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
  status: string;
  city: string | null;
  seller: { name: string; email: string | null };
}

const STATUS_LABELS: Record<string, string> = {
  '': 'Tümü',
  active: 'Aktif',
  sold: 'Satıldı',
  reserved: 'Rezerve',
};

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
    <PageShell
      title="İlanlar"
      subtitle={`${data?.total ?? 0} kayıt · durum filtrele`}
    >
      <SearchInput
        value={q}
        onChangeText={setQ}
        placeholder="Başlık veya açıklama ara..."
        onSubmitEditing={() => refetch()}
        returnKeyType="search"
      />
      <FilterRow>
        {statuses.map((s) => (
          <Chip
            key={s || 'all'}
            label={STATUS_LABELS[s] ?? s}
            active={status === s}
            onPress={() => setStatus(s)}
          />
        ))}
      </FilterRow>

      <DataTable
        columns={[
          { key: 'title', title: 'Başlık', flex: 2 },
          { key: 'price', title: 'Fiyat', width: 100 },
          { key: 'category', title: 'Kategori', width: 100 },
          { key: 'seller', title: 'Satıcı', flex: 1 },
          { key: 'status', title: 'Durum', width: 80 },
          { key: 'action', title: 'İşlem', width: 70 },
        ]}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        onRowPress={(item) => router.push(`/listing/${item.id}`)}
        emptyMessage="İlan bulunamadı"
        renderCell={(item, col) => {
          if (col.key === 'title') return <CellText bold>{item.title}</CellText>;
          if (col.key === 'price') return <CellText>{item.price.toLocaleString('tr-TR')} ₺</CellText>;
          if (col.key === 'category') return <CellText muted>{item.category}</CellText>;
          if (col.key === 'seller') return <CellText muted>{item.seller?.name ?? '—'}</CellText>;
          if (col.key === 'status') {
            return <Badge text={item.status} tone={item.status === 'active' ? 'success' : 'default'} />;
          }
          return (
            <Btn label="Sil" variant="danger" compact onPress={() => deleteListing(item.id, item.title)} />
          );
        }}
      />
    </PageShell>
  );
}
