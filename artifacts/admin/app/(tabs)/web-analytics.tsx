import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { adminFetch } from '@/lib/api';
import { Badge, Card, Loading, StatCard } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { DataTable, CellText } from '@/components/DataTable';
import { THEME, SPACING, RADIUS } from '@/lib/theme';

interface WebAnalyticsResponse {
  platform: 'web';
  live: number;
  last24h: number;
  loggedInLive: number;
  guestLive: number;
  newToday: number;
  sessions: {
    deviceId: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    platform: string | null;
    appVersion: string | null;
    lastPingAt: string;
    firstSeenAt: string;
    isLoggedIn: boolean;
  }[];
  recentLogins: {
    id: string;
    name: string;
    email: string | null;
    lastActiveAt: string;
    deviceId: string;
  }[];
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'şimdi';
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} sa önce`;
  return new Date(iso).toLocaleString('tr-TR');
}

export default function WebAnalyticsScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-web-analytics'],
    queryFn: () => adminFetch<WebAnalyticsResponse>('/admin/analytics/web'),
    refetchInterval: 20_000,
  });

  if (isLoading || !data) return <Loading />;

  return (
    <PageShell
      showBack
      title="Web Ziyaretçileri"
      subtitle="Tarayıcı · masaüstü & mobil web · giriş ve hareketler"
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>🌐 Web Analitiği</Text>
        <Text style={styles.heroSub}>
          Her satır benzersiz tarayıcı oturumu. Giriş yapan kullanıcılar isim ve e-posta ile listelenir.
        </Text>
      </Card>

      <Section title="Özet">
        <View style={styles.statsGrid}>
          <StatCard icon="🟢" label="Anlık Aktif" value={data.live} color={THEME.success} />
          <StatCard icon="📈" label="Son 24 Saat" value={data.last24h} color={THEME.info} />
          <StatCard icon="🔐" label="Girişli (anlık)" value={data.loggedInLive} color={THEME.gold} />
          <StatCard icon="👤" label="Misafir (anlık)" value={data.guestLive} color={THEME.accent} />
          <StatCard icon="✨" label="Bugün Yeni Oturum" value={data.newToday} color={THEME.warning} />
        </View>
      </Section>

      <Section title="Son Girişler (Web)">
        <DataTable
          columns={[
            { key: 'name', title: 'Kullanıcı', flex: 2 },
            { key: 'email', title: 'E-posta', flex: 2 },
            { key: 'time', title: 'Son Aktif', width: 100 },
          ]}
          data={data.recentLogins}
          keyExtractor={(r) => `${r.id}-${r.deviceId}`}
          onRowPress={(r) => router.push(`/user/${r.id}`)}
          emptyMessage="Şu an giriş yapmış web kullanıcısı yok"
          renderCell={(r, col) => {
            if (col.key === 'name') return <CellText bold>{r.name}</CellText>;
            if (col.key === 'email') return <CellText muted>{r.email ?? '—'}</CellText>;
            return <CellText muted>{formatRelative(r.lastActiveAt)}</CellText>;
          }}
        />
      </Section>

      <Section title="Canlı Oturumlar">
        <DataTable
          columns={[
            { key: 'user', title: 'Kişi', flex: 2 },
            { key: 'status', title: 'Durum', width: 90 },
            { key: 'device', title: 'Oturum', flex: 1 },
            { key: 'seen', title: 'İlk', width: 80 },
            { key: 'ping', title: 'Ping', width: 80 },
          ]}
          data={data.sessions}
          keyExtractor={(s) => s.deviceId}
          emptyMessage="Aktif web oturumu yok"
          onRowPress={(s) => s.userId && router.push(`/user/${s.userId}`)}
          renderCell={(s, col) => {
            if (col.key === 'user') {
              if (s.isLoggedIn) {
                return (
                  <View>
                    <CellText bold>{s.userName ?? 'Kullanıcı'}</CellText>
                    {s.userEmail ? <CellText muted>{s.userEmail}</CellText> : null}
                  </View>
                );
              }
              return <CellText muted>Misafir ziyaretçi</CellText>;
            }
            if (col.key === 'status') {
              return (
                <Badge
                  text={s.isLoggedIn ? 'Girişli' : 'Misafir'}
                  tone={s.isLoggedIn ? 'success' : 'default'}
                />
              );
            }
            if (col.key === 'device') {
              return <CellText muted>{s.deviceId.slice(0, 14)}…</CellText>;
            }
            if (col.key === 'seen') {
              return <CellText muted>{new Date(s.firstSeenAt).toLocaleDateString('tr-TR')}</CellText>;
            }
            return <CellText muted>{formatRelative(s.lastPingAt)}</CellText>;
          }}
        />
      </Section>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: THEME.goldLight, marginBottom: 6 },
  heroSub: { fontSize: 12, color: THEME.textMuted, lineHeight: 18 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
});
