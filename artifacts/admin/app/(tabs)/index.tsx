import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Btn, Loading, StatCard } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { DataTable, CellText } from '@/components/DataTable';
import { THEME, SPACING } from '@/lib/theme';

interface StatsResponse {
  counts: {
    users: number;
    listings: number;
    activeListings: number;
    soldListings: number;
    comments: number;
    pendingReports: number;
    conversations: number;
    bannedUsers: number;
  };
  live: {
    users: { live: number; last24h: number; newToday: number; liveDevices: { deviceId: string; platform: string | null; lastPingAt: string }[] };
    listings: { live: number; last24h: number; newToday: number };
  };
  recentUsers: { id: string; name: string; email: string | null; badge_emoji?: string | null; created_at: string }[];
  recentListings: { id: string; title: string; price: number; status: string; sellerName: string }[];
}

export default function DashboardScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminFetch<StatsResponse>('/admin/stats'),
    refetchInterval: 30_000,
  });

  if (isLoading || !data) return <Loading />;

  const live = data.live;
  const roleLabel = profile?.role === 'admin' ? 'Süper Admin' : 'Moderatör';

  return (
    <PageShell
      title="Canlı Panel"
      subtitle={`${profile?.name} · ${roleLabel}`}
      headerRight={<Btn label="Çıkış" variant="ghost" compact onPress={signOut} />}
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      <Section title="Kullanıcılar">
        <View style={styles.statsGrid}>
          <StatCard icon="👥" label="Anlık Aktif (5dk)" value={live?.users?.live ?? 0} color={THEME.success} />
          <StatCard icon="📈" label="Son 24 Saat" value={live?.users?.last24h ?? 0} color={THEME.info} />
          <StatCard icon="✨" label="Bugün Yeni" value={live?.users?.newToday ?? 0} color={THEME.gold} />
          <StatCard icon="🌐" label="Toplam" value={data.counts.users} />
        </View>
      </Section>

      <Section title="İlanlar">
        <View style={styles.statsGrid}>
          <StatCard icon="👁" label="Anlık Görüntülenen" value={live?.listings?.live ?? 0} color={THEME.success} />
          <StatCard icon="📊" label="24s Görüntülenen" value={live?.listings?.last24h ?? 0} color={THEME.info} />
          <StatCard icon="🆕" label="Bugün Yeni İlan" value={live?.listings?.newToday ?? 0} color={THEME.gold} />
          <StatCard icon="📦" label="Aktif İlan" value={data.counts.activeListings} />
        </View>
      </Section>

      <Section title="Genel Özet">
        <View style={styles.statsGrid}>
          <StatCard icon="🚩" label="Şikayet" value={data.counts.pendingReports} color={THEME.warning} />
          <StatCard icon="🚫" label="Engelli" value={data.counts.bannedUsers} color={THEME.danger} />
          <StatCard icon="💬" label="Yorum" value={data.counts.comments} />
          <StatCard icon="✉️" label="Mesaj" value={data.counts.conversations} />
        </View>
      </Section>

      {live?.users?.liveDevices?.length ? (
        <Section title="Anlık Cihazlar">
          <DataTable
            columns={[
              { key: 'device', title: 'Cihaz ID', flex: 2 },
              { key: 'platform', title: 'Platform', width: 90 },
              { key: 'time', title: 'Son Ping', width: 90 },
            ]}
            data={live.users.liveDevices.slice(0, 8)}
            keyExtractor={(d) => d.deviceId}
            renderCell={(d, col) => {
              if (col.key === 'device') return <CellText bold>{d.deviceId.slice(0, 14)}…</CellText>;
              if (col.key === 'platform') return <CellText muted>{d.platform ?? '?'}</CellText>;
              return <CellText muted>{new Date(d.lastPingAt).toLocaleTimeString('tr-TR')}</CellText>;
            }}
          />
        </Section>
      ) : null}

      <Section title="Son Kullanıcılar">
        <DataTable
          columns={[
            { key: 'name', title: 'İsim', flex: 2 },
            { key: 'email', title: 'E-posta', flex: 2 },
            { key: 'date', title: 'Kayıt', width: 100 },
          ]}
          data={data.recentUsers}
          keyExtractor={(u) => u.id}
          onRowPress={(u) => router.push(`/user/${u.id}`)}
          emptyMessage="Henüz kullanıcı yok"
          renderCell={(u, col) => {
            if (col.key === 'name') {
              return <CellText bold>{u.badge_emoji ? `${u.badge_emoji} ` : ''}{u.name}</CellText>;
            }
            if (col.key === 'email') return <CellText muted>{u.email ?? '—'}</CellText>;
            return <CellText muted>{new Date(u.created_at).toLocaleDateString('tr-TR')}</CellText>;
          }}
        />
      </Section>

      <Section title="Son İlanlar">
        <DataTable
          columns={[
            { key: 'title', title: 'Başlık', flex: 2 },
            { key: 'seller', title: 'Satıcı', flex: 1 },
            { key: 'price', title: 'Fiyat', width: 100 },
            { key: 'status', title: 'Durum', width: 80 },
          ]}
          data={data.recentListings}
          keyExtractor={(l) => l.id}
          onRowPress={(l) => router.push(`/listing/${l.id}`)}
          emptyMessage="Henüz ilan yok"
          renderCell={(l, col) => {
            if (col.key === 'title') return <CellText bold>{l.title}</CellText>;
            if (col.key === 'seller') return <CellText muted>{l.sellerName}</CellText>;
            if (col.key === 'price') return <CellText>{l.price.toLocaleString('tr-TR')} ₺</CellText>;
            return <Badge text={l.status} tone={l.status === 'active' ? 'success' : 'default'} />;
          }}
        />
      </Section>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
});
