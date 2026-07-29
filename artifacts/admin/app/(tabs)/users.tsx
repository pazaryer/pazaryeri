import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { adminFetch } from '@/lib/api';
import { Badge, Btn, Card, EmptyState, Input, Loading, Screen, Title } from '@/components/ui';
import { THEME, SPACING } from '@/lib/theme';

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

  const queryKey = ['admin-users', q, filter];
  const { data, isLoading, refetch } = useQuery({
    queryKey,
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
    <Screen style={{ paddingBottom: 0 }}>
      <Title>Kullanıcılar ({data?.total ?? 0})</Title>
      <Input value={q} onChangeText={setQ} placeholder="Ara: isim, e-posta, telefon" onSubmitEditing={() => refetch()} />
      <View style={styles.filters}>
        {(['all', 'banned', 'admin'] as const).map((f) => (
          <Btn
            key={f}
            label={f === 'all' ? 'Tümü' : f === 'banned' ? 'Engelli' : 'Admin'}
            variant={filter === f ? 'primary' : 'ghost'}
            onPress={() => setFilter(f)}
          />
        ))}
      </View>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message="Kullanıcı bulunamadı" />}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Pressable onPress={() => router.push(`/user/${item.id}`)}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.badges}>
                  {item.is_verified && <Badge text="✓" tone="success" />}
                  {item.is_banned && <Badge text="ENGEL" tone="danger" />}
                  {item.role !== 'user' && <Badge text={item.role.toUpperCase()} tone="warning" />}
                </View>
              </View>
              <Text style={styles.sub}>{item.email ?? '—'}</Text>
              <Text style={styles.sub}>⭐ {item.rating.toFixed(1)}</Text>
            </Pressable>
            <Btn
              label={item.is_banned ? 'Engeli Kaldır' : 'Engelle'}
              variant={item.is_banned ? 'ghost' : 'danger'}
              onPress={() => toggleBan(item)}
            />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  row: { marginBottom: SPACING.sm, gap: SPACING.sm },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { flexDirection: 'row', gap: 4 },
  name: { color: THEME.text, fontWeight: '700', fontSize: 16 },
  sub: { color: THEME.textMuted, fontSize: 12 },
});
