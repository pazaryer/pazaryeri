import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { adminFetch } from '@/lib/api';
import { Badge, Btn, Chip, Loading, SearchInput } from '@/components/ui';
import { PageShell, FilterRow } from '@/components/PageShell';
import { DataTable, CellText } from '@/components/DataTable';

interface UserRow {
  id: string;
  name: string;
  email: string | null;
  role: string;
  is_verified: boolean;
  is_banned: boolean;
  rating: number;
  created_at: string;
}

export default function UsersScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'banned' | 'admin'>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', q, filter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' });
      if (q) params.set('q', q);
      if (filter === 'banned') params.set('banned', 'true');
      if (filter === 'admin') params.set('role', 'admin');
      return adminFetch<{ items: UserRow[]; total: number }>(`/admin/users?${params}`);
    },
  });

  async function toggleBan(user: UserRow) {
    const next = !user.is_banned;
    Alert.alert(
      next ? 'Kullanıcıyı Engelle' : 'Engeli Kaldır',
      `${user.name} — ${next ? 'engellensin mi?' : 'engel kaldırılsın mı?'}`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          style: next ? 'destructive' : 'default',
          onPress: async () => {
            await adminFetch(`/admin/users/${user.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ isBanned: next, banReason: next ? 'Admin panelinden engellendi' : null }),
            });
            refetch();
          },
        },
      ],
    );
  }

  if (isLoading) return <Loading />;

  return (
    <PageShell
      title="Kullanıcılar"
      subtitle={`${data?.total ?? 0} kayıt · arama ve filtrele`}
    >
      <SearchInput
        value={q}
        onChangeText={setQ}
        placeholder="Ara: isim, e-posta, telefon"
        onSubmitEditing={() => refetch()}
        returnKeyType="search"
      />
      <FilterRow>
        {(['all', 'banned', 'admin'] as const).map((f) => (
          <Chip
            key={f}
            label={f === 'all' ? 'Tümü' : f === 'banned' ? 'Engelli' : 'Admin'}
            active={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </FilterRow>

      <DataTable
        columns={[
          { key: 'name', title: 'İsim', flex: 2 },
          { key: 'email', title: 'E-posta', flex: 2 },
          { key: 'rating', title: 'Puan', width: 70 },
          { key: 'tags', title: 'Etiket', width: 110 },
          { key: 'action', title: 'İşlem', width: 100 },
        ]}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        onRowPress={(item) => router.push(`/user/${item.id}`)}
        emptyMessage="Kullanıcı bulunamadı"
        renderCell={(item, col) => {
          if (col.key === 'name') return <CellText bold>{item.name}</CellText>;
          if (col.key === 'email') return <CellText muted>{item.email ?? '—'}</CellText>;
          if (col.key === 'rating') return <CellText>⭐ {item.rating.toFixed(1)}</CellText>;
          if (col.key === 'tags') {
            return (
              <View style={styles.tags}>
                {item.is_verified && <Badge text="✓" tone="success" />}
                {item.is_banned && <Badge text="ENGEL" tone="danger" />}
                {item.role !== 'user' && <Badge text={item.role.toUpperCase()} tone="gold" />}
              </View>
            );
          }
          return (
            <Btn
              label={item.is_banned ? 'Aç' : 'Engelle'}
              variant={item.is_banned ? 'ghost' : 'danger'}
              compact
              onPress={() => toggleBan(item)}
            />
          );
        }}
      />
    </PageShell>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingHorizontal: 6 },
});
