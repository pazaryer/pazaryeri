import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loading, EmptyState } from '@/components/ui';
import { PageShell } from '@/components/PageShell';
import { DataTable, CellText } from '@/components/DataTable';

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
      <PageShell showBack title="Denetim Kaydı" subtitle="Sadece süper admin erişebilir">
        <EmptyState message="Bu sayfaya erişim yetkiniz yok" />
      </PageShell>
    );
  }

  if (isLoading) return <Loading />;

  return (
    <PageShell
      showBack
      title="Admin İşlem Kaydı"
      subtitle="Tüm moderasyon ve yapılandırma işlemleri"
    >
      <DataTable
        columns={[
          { key: 'action', title: 'İşlem', flex: 2 },
          { key: 'admin', title: 'Admin', flex: 1 },
          { key: 'target', title: 'Hedef', flex: 1 },
          { key: 'date', title: 'Tarih', width: 120 },
        ]}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        emptyMessage="Kayıt yok"
        renderCell={(item, col) => {
          if (col.key === 'action') return <CellText bold>{item.action}</CellText>;
          if (col.key === 'admin') return <CellText muted>{item.users?.name ?? '—'}</CellText>;
          if (col.key === 'target') {
            return (
              <CellText muted>
                {item.target_type ? `${item.target_type}: ${item.target_id ?? '—'}` : '—'}
              </CellText>
            );
          }
          return <CellText muted>{new Date(item.created_at).toLocaleString('tr-TR')}</CellText>;
        }}
      />
    </PageShell>
  );
}
