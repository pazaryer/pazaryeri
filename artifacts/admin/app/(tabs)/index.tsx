import { useQuery } from '@tanstack/react-query';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Btn, Card, Loading, Screen, StatCard, Subtitle, Title } from '@/components/ui';
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

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <ScrollView refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={THEME.gold} />}>
        <View style={styles.header}>
          <View>
            <Title>Canlı Panel</Title>
            <Subtitle>{profile?.name} · {profile?.role === 'admin' ? 'Süper Admin' : 'Moderatör'}</Subtitle>
          </View>
          <Btn label="Çıkış" variant="ghost" onPress={signOut} />
        </View>

        <Text style={styles.section}>👥 Kullanıcılar</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Anlık Aktif (5dk)" value={live?.users?.live ?? 0} color={THEME.success} />
          <StatCard label="Son 24 Saat" value={live?.users?.last24h ?? 0} color={THEME.info} />
          <StatCard label="Bugün Yeni" value={live?.users?.newToday ?? 0} color={THEME.gold} />
          <StatCard label="Toplam" value={data.counts.users} />
        </View>

        <Text style={styles.section}>📦 İlanlar</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Anlık Görüntülenen" value={live?.listings?.live ?? 0} color={THEME.success} />
          <StatCard label="24s Görüntülenen" value={live?.listings?.last24h ?? 0} color={THEME.info} />
          <StatCard label="Bugün Yeni İlan" value={live?.listings?.newToday ?? 0} color={THEME.gold} />
          <StatCard label="Aktif İlan" value={data.counts.activeListings} />
        </View>

        <Text style={styles.section}>📊 Genel</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Şikayet" value={data.counts.pendingReports} color={THEME.warning} />
          <StatCard label="Engelli" value={data.counts.bannedUsers} color={THEME.danger} />
          <StatCard label="Yorum" value={data.counts.comments} />
          <StatCard label="Mesaj" value={data.counts.conversations} />
        </View>

        {live?.users?.liveDevices?.length ? (
          <>
            <Text style={styles.section}>🟢 Anlık Cihazlar (tek kimlik)</Text>
            {live.users.liveDevices.slice(0, 8).map((d) => (
              <Card key={d.deviceId} style={styles.deviceRow}>
                <Text style={styles.deviceId}>{d.deviceId.slice(0, 12)}…</Text>
                <Text style={styles.deviceMeta}>{d.platform ?? '?'} · {new Date(d.lastPingAt).toLocaleTimeString('tr-TR')}</Text>
              </Card>
            ))}
          </>
        ) : null}

        <Text style={styles.section}>Son Kullanıcılar</Text>
        {data.recentUsers.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(`/user/${item.id}`)}>
            <Card style={styles.row}>
              <Text style={styles.rowTitle}>
                {item.badge_emoji ? `${item.badge_emoji} ` : ''}{item.name}
              </Text>
              <Text style={styles.rowSub}>{item.email ?? '—'}</Text>
            </Card>
          </Pressable>
        ))}

        <Text style={styles.section}>Son İlanlar</Text>
        {data.recentListings.map((l) => (
          <Pressable key={l.id} onPress={() => router.push(`/listing/${l.id}`)}>
            <Card style={styles.row}>
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle} numberOfLines={1}>{l.title}</Text>
                <Badge text={l.status} tone={l.status === 'active' ? 'success' : 'default'} />
              </View>
              <Text style={styles.rowSub}>{l.sellerName} · {l.price.toLocaleString('tr-TR')} ₺</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.md },
  section: { fontSize: 15, fontWeight: '700', color: THEME.gold, marginTop: SPACING.md, marginBottom: SPACING.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  row: { marginBottom: SPACING.sm },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
  rowTitle: { color: THEME.text, fontWeight: '600', flex: 1 },
  rowSub: { color: THEME.textMuted, fontSize: 12, marginTop: 4 },
  deviceRow: { marginBottom: 6, paddingVertical: 8 },
  deviceId: { color: THEME.text, fontFamily: 'monospace', fontSize: 12 },
  deviceMeta: { color: THEME.textMuted, fontSize: 11, marginTop: 2 },
});
