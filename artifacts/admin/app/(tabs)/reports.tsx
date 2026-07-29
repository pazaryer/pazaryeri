import { useQuery } from '@tanstack/react-query';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { Badge, Btn, Card, EmptyState, Loading, Screen, Title } from '@/components/ui';
import { THEME, SPACING } from '@/lib/theme';

interface ReportRow {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter: { name: string } | null;
  listings: { title: string } | null;
}

export default function ReportsScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminFetch<{ items: ReportRow[] }>('/admin/reports?status=pending'),
  });

  async function resolve(id: string, status: 'resolved' | 'dismissed') {
    await adminFetch(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    refetch();
  }

  if (isLoading) return <Loading />;

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <Title>Bekleyen Şikayetler</Title>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message="Bekleyen şikayet yok" />}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Badge text={item.status} tone="warning" />
            <Text style={styles.reason}>{item.reason}</Text>
            {item.description ? <Text style={styles.sub}>{item.description}</Text> : null}
            <Text style={styles.sub}>
              Şikayetçi: {item.reporter?.name ?? '—'}
              {item.listings?.title ? ` · İlan: ${item.listings.title}` : ''}
            </Text>
            <Text style={styles.sub}>{new Date(item.created_at).toLocaleString('tr-TR')}</Text>
            <View style={styles.actions}>
              <Btn label="Çözüldü" onPress={() => resolve(item.id, 'resolved')} />
              <Btn label="Reddet" variant="ghost" onPress={() => resolve(item.id, 'dismissed')} />
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: SPACING.sm, gap: SPACING.sm },
  reason: { color: THEME.text, fontWeight: '600', fontSize: 15 },
  sub: { color: THEME.textMuted, fontSize: 12 },
  actions: { flexDirection: 'row', gap: SPACING.sm },
});
