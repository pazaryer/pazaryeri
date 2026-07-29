import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Btn, Loading, StatCard } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { DataTable, CellText } from '@/components/DataTable';
import { THEME, SPACING, RADIUS } from '@/lib/theme';

type PlatformSession = {
  deviceId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  platform: string | null;
  appVersion: string | null;
  lastPingAt: string;
  isLoggedIn: boolean;
  isAdminSession?: boolean;
};

type PlatformActivity = {
  live: number;
  last24h: number;
  loggedInLive: number;
  guestLive: number;
  sessions: PlatformSession[];
};

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
  analyticsResetAt?: string | null;
  live: {
    users: {
      live: number;
      last24h: number;
      newToday: number;
    };
    listings: { live: number; last24h: number; newToday: number };
  };
  platformActivity?: {
    web: PlatformActivity;
    mobile: PlatformActivity;
    admin: PlatformActivity;
  };
  recentUsers: { id: string; name: string; email: string | null; badge_emoji?: string | null; created_at: string }[];
  recentListings: { id: string; title: string; price: number; status: string; sellerName: string }[];
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'şimdi';
  if (mins < 60) return `${mins} dk`;
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function PlatformLiveTable({
  title,
  icon,
  activity,
  showPlatform,
}: {
  title: string;
  icon: string;
  activity?: PlatformActivity;
  showPlatform?: boolean;
}) {
  const sessions = activity?.sessions ?? [];
  return (
    <View style={styles.platformBlock}>
      <View style={styles.platformHead}>
        <Text style={styles.platformTitle}>{icon} {title}</Text>
        <View style={styles.platformStats}>
          <Text style={styles.platformStat}>🟢 {activity?.live ?? 0}</Text>
          <Text style={styles.platformStatMuted}>24s: {activity?.last24h ?? 0}</Text>
          <Text style={styles.platformStatMuted}>Girişli: {activity?.loggedInLive ?? 0}</Text>
        </View>
      </View>
      <DataTable
        columns={[
          { key: 'user', title: 'Kişi', flex: 2 },
          ...(showPlatform ? [{ key: 'platform', title: 'OS', width: 70 }] : []),
          { key: 'status', title: 'Durum', width: 80 },
          { key: 'time', title: 'Ping', width: 70 },
        ]}
        data={sessions}
        keyExtractor={(s) => s.deviceId}
        emptyMessage="Şu an aktif yok"
        renderCell={(s, col) => {
          if (col.key === 'user') {
            if (s.userName) {
              return (
                <View>
                  <CellText bold>{s.userName}</CellText>
                  {s.userEmail ? <CellText muted>{s.userEmail}</CellText> : null}
                </View>
              );
            }
            if (s.isAdminSession || (title.includes('Admin') && s.platform === 'admin')) {
              return <CellText muted>Yönetici oturumu</CellText>;
            }
            return <CellText muted>Misafir</CellText>;
          }
          if (col.key === 'platform') return <CellText muted>{s.platform ?? '—'}</CellText>;
          if (col.key === 'status') {
            const isAdminSession = Boolean(s.isAdminSession) || (title.includes('Admin') && s.platform === 'admin');
            const loggedIn = s.isLoggedIn || isAdminSession;
            return (
              <Badge
                text={loggedIn ? (isAdminSession ? 'Admin' : 'Girişli') : 'Misafir'}
                tone={loggedIn ? 'success' : 'default'}
              />
            );
          }
          return <CellText muted>{formatRelative(s.lastPingAt)}</CellText>;
        }}
      />
    </View>
  );
}

export default function DashboardScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminFetch<StatsResponse>('/admin/stats'),
    refetchInterval: 30_000,
  });

  async function resetAnalytics() {
    Alert.alert(
      'İstatistikleri Sıfırla',
      'Anlık, 24 saat ve bugün sayaçları sıfırlanır. Kullanıcı ve ilan verileri silinmez.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await adminFetch('/admin/stats/reset', { method: 'POST' });
            await adminFetch('/admin/publish', { method: 'POST' });
            refetch();
            Alert.alert('Tamam', 'Canlı istatistikler sıfırlandı.');
          },
        },
      ],
    );
  }

  if (isLoading || !data) return <Loading />;

  const live = data.live;
  const platform = data.platformActivity;
  const roleLabel = profile?.role === 'admin' ? 'Süper Admin' : 'Moderatör';

  return (
    <PageShell
      title="Canlı Panel"
      subtitle={`${profile?.name} · ${roleLabel}`}
      headerRight={<Btn label="Çıkış" variant="ghost" compact onPress={signOut} />}
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Gerçek Zamanlı Kontrol</Text>
        <Text style={styles.heroSub}>
          Web · mobil · admin ayrı takip · {data.analyticsResetAt
            ? `Son sıfırlama: ${new Date(data.analyticsResetAt).toLocaleString('tr-TR')}`
            : 'Henüz sıfırlanmadı'}
        </Text>
        <View style={styles.heroActions}>
          <Btn label="İstatistik Sıfırla" variant="danger" compact onPress={resetAnalytics} />
          <Btn label="Yenile" variant="ghost" compact onPress={() => refetch()} />
        </View>
      </View>

      <Section title="Özet">
        <View style={styles.statsGrid}>
          <StatCard icon="🟢" label="Toplam Anlık" value={live?.users?.live ?? 0} color={THEME.success} />
          <StatCard icon="🌐" label="Web Aktif" value={platform?.web?.live ?? 0} color={THEME.info} />
          <StatCard icon="📱" label="Mobil Aktif" value={platform?.mobile?.live ?? 0} color={THEME.accent} />
          <StatCard icon="🛡️" label="Admin Aktif" value={platform?.admin?.live ?? 0} color={THEME.gold} />
        </View>
      </Section>

      <Section title="Canlı İlanlar">
        <View style={styles.statsGrid}>
          <StatCard icon="👁" label="Anlık Görüntülenen" value={live?.listings?.live ?? 0} color={THEME.success} />
          <StatCard icon="📊" label="24s Görüntülenen" value={live?.listings?.last24h ?? 0} color={THEME.info} />
          <StatCard icon="📦" label="Aktif İlan" value={data.counts.activeListings} color={THEME.gold} />
          <StatCard icon="🚩" label="Şikayet" value={data.counts.pendingReports} color={THEME.warning} />
        </View>
      </Section>

      <Section title="Platform Aktivitesi">
        <PlatformLiveTable title="Web Sitesi" icon="🌐" activity={platform?.web} />
        <PlatformLiveTable title="Mobil Uygulama" icon="📱" activity={platform?.mobile} showPlatform />
        <PlatformLiveTable title="Admin Uygulaması" icon="🛡️" activity={platform?.admin} />
      </Section>

      <CollapsibleSection title="Son Kullanıcılar" subtitle={`${data.recentUsers.length} kayıt · dokun aç/kapa`}>
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
      </CollapsibleSection>

      <CollapsibleSection title="Son İlanlar" subtitle={`${data.recentListings.length} kayıt · dokun aç/kapa`}>
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
      </CollapsibleSection>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: THEME.text, marginBottom: 6 },
  heroSub: { fontSize: 12, color: THEME.textMuted, lineHeight: 18, marginBottom: SPACING.md },
  heroActions: { flexDirection: 'row', gap: SPACING.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  platformBlock: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
    padding: SPACING.sm,
  },
  platformHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  platformTitle: { fontSize: 14, fontWeight: '800', color: THEME.text },
  platformStats: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  platformStat: { fontSize: 12, fontWeight: '700', color: THEME.success },
  platformStatMuted: { fontSize: 11, color: THEME.textMuted },
});
