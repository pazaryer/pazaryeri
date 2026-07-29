import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text } from 'react-native';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, EmptyState, Loading, Screen, Subtitle, Title } from '@/components/ui';
import { THEME, SPACING } from '@/lib/theme';

interface AuditRow {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  users: { name: string; email: string | null } | null;
}

export default function AuditScreen() {
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => adminFetch<{ items: AuditRow[] }>('/admin/audit'),
    enabled: profile?.role === 'admin',
  });

  if (profile?.role !== 'admin') {
    return (
      <Screen>
        <Title>Denetim Kaydı</Title>
        <Subtitle>Sadece süper admin erişebilir</Subtitle>
      </Screen>
    );
  }

  if (isLoading) return <Loading />;

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <Title>Admin İşlem Kaydı</Title>
      <Subtitle>Tüm moderasyon ve yapılandırma işlemleri</Subtitle>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message="Kayıt yok" />}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Text style={styles.action}>{item.action}</Text>
            <Text style={styles.sub}>
              {item.users?.name ?? '—'} · {new Date(item.created_at).toLocaleString('tr-TR')}
            </Text>
            {item.target_type ? (
              <Text style={styles.sub}>
                {item.target_type}: {item.target_id ?? '—'}
              </Text>
            ) : null}
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: SPACING.sm },
  action: { color: THEME.gold, fontWeight: '700' },
  sub: { color: THEME.textMuted, fontSize: 11, marginTop: 2 },
});
