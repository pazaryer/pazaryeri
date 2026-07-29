import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { Badge, Btn, Loading } from '@/components/ui';
import { PageShell } from '@/components/PageShell';
import { DataTable, CellText } from '@/components/DataTable';

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
  const { data, isLoading, refetch, isRefetching } = useQuery({
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
    <PageShell
      title="Şikayetler"
      subtitle={`${data?.items?.length ?? 0} bekleyen şikayet`}
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      <DataTable
        columns={[
          { key: 'reason', title: 'Sebep', flex: 2 },
          { key: 'reporter', title: 'Şikayetçi', flex: 1 },
          { key: 'listing', title: 'İlan', flex: 1 },
          { key: 'date', title: 'Tarih', width: 100 },
          { key: 'actions', title: 'İşlem', width: 160 },
        ]}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        emptyMessage="Bekleyen şikayet yok"
        renderCell={(item, col) => {
          if (col.key === 'reason') {
            return (
              <View>
                <CellText bold>{item.reason}</CellText>
                {item.description ? <CellText muted>{item.description}</CellText> : null}
              </View>
            );
          }
          if (col.key === 'reporter') return <CellText muted>{item.reporter?.name ?? '—'}</CellText>;
          if (col.key === 'listing') return <CellText muted>{item.listings?.title ?? '—'}</CellText>;
          if (col.key === 'date') {
            return <CellText muted>{new Date(item.created_at).toLocaleDateString('tr-TR')}</CellText>;
          }
          return (
            <View style={styles.actions}>
              <Btn label="Çözüldü" compact onPress={() => resolve(item.id, 'resolved')} />
              <Btn label="Reddet" variant="ghost" compact onPress={() => resolve(item.id, 'dismissed')} />
            </View>
          );
        }}
      />
    </PageShell>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 6, paddingHorizontal: 4 },
});
