import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Btn, Card, Loading, StatCard } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { DataTable, CellText } from '@/components/DataTable';
import { THEME, SPACING, RADIUS } from '@/lib/theme';

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
      liveDevices: { deviceId: string; userId?: string | null; platform: string | null; lastPingAt: string }[];
    };
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

  async function resetAnalytics() {
    Alert.alert(
      'İstatistikleri Sıfırla',
      'Anlık, 24 saat ve bugün sayaçları sıfırlanır. Kullanıcı ve ilan verileri silinmez. Kullanıcılar uygulamayı açınca gerçek veriler tekrar birikir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await adminFetch('/admin/stats/reset', { method: 'POST' });
            await adminFetch('/admin/publish', { method: 'POST' });
            refetch();
            Alert.alert('Tamam', 'Canlı istatistikler sıfırlandı ve yayınlandı.');
          },
        },
      ],
    );
  }

  if (isLoading || !data) return <Loading />;

  const live = data.live;
  const roleLabel = profile?.role === 'admin' ? 'Süper Admin' : 'Moderatör';

  return (
    <PageShell
      title="Canlı Panel"
      subtitle={`${profile?.name} · ${roleLabel} · her cihaz tek kimlik`}
      headerRight={<Btn label="Çıkış" variant="ghost" compact onPress={signOut} />}
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.25)', 'rgba(212, 175, 55, 0.12)', 'transparent']}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Gerçek Zamanlı Kontrol</Text>
        <Text style={styles.heroSub}>
          Mobil + masaüstü · cihaz başına 1 ziyaretçi · {data.analyticsResetAt
            ? `Son sıfırlama: ${new Date(data.analyticsResetAt).toLocaleString('tr-TR')}`
            : 'Henüz sıfırlanmadı'}
        </Text>
        <View style={styles.heroActions}>
          <Btn label="İstatistik Sıfırla" variant="danger" compact onPress={resetAnalytics} />
          <Btn label="Yenile" variant="ghost" compact onPress={() => refetch()} />
        </View>
      </LinearGradient>

      <Section title="Canlı Kullanıcılar">
        <View style={styles.statsGrid}>
          <StatCard icon="🟢" label="Anlık Aktif" value={live?.users?.live ?? 0} color={THEME.success} />
          <StatCard icon="📈" label="Son 24 Saat" value={live?.users?.last24h ?? 0} color={THEME.info} />
          <StatCard icon="✨" label="Bugün Yeni" value={live?.users?.newToday ?? 0} color={THEME.accent} />
          <StatCard icon="🌐" label="Toplam Üye" value={data.counts.users} color={THEME.gold} />
        </View>
      </Section>

      <Section title="Canlı İlanlar">
        <View style={styles.statsGrid}>
          <StatCard icon="👁" label="Anlık Görüntülenen" value={live?.listings?.live ?? 0} color={THEME.success} />
          <StatCard icon="📊" label="24s Görüntülenen" value={live?.listings?.last24h ?? 0} color={THEME.info} />
          <StatCard icon="🆕" label="Bugün Yeni" value={live?.listings?.newToday ?? 0} color={THEME.accent} />
          <StatCard icon="📦" label="Aktif İlan" value={data.counts.activeListings} color={THEME.gold} />
        </View>
      </Section>

      <Section title="Platform Özeti">
        <View style={styles.statsGrid}>
          <StatCard icon="🚩" label="Şikayet" value={data.counts.pendingReports} color={THEME.warning} />
          <StatCard icon="🚫" label="Engelli" value={data.counts.bannedUsers} color={THEME.danger} />
          <StatCard icon="💬" label="Yorum" value={data.counts.comments} />
          <StatCard icon="✉️" label="Mesaj" value={data.counts.conversations} />
        </View>
      </Section>

      <Section title="Anlık Cihazlar (tek kişi)">
        <Card style={styles.deviceHint}>
          <Text style={styles.deviceHintText}>
            Her satır = 1 benzersiz cihaz. Aynı kullanıcı telefon + bilgisayarda 2 satır görünür.
          </Text>
        </Card>
        <DataTable
          columns={[
            { key: 'device', title: 'Cihaz ID', flex: 2 },
            { key: 'platform', title: 'Platform', width: 80 },
            { key: 'user', title: 'Kullanıcı', width: 90 },
            { key: 'time', title: 'Ping', width: 80 },
          ]}
          data={live?.users?.liveDevices ?? []}
          keyExtractor={(d) => d.deviceId}
          emptyMessage="Şu an aktif cihaz yok"
          renderCell={(d, col) => {
            if (col.key === 'device') return <CellText bold>{d.deviceId.slice(0, 12)}…</CellText>;
            if (col.key === 'platform') return <CellText muted>{d.platform ?? '?'}</CellText>;
            if (col.key === 'user') return <CellText muted>{d.userId ? 'Girişli' : 'Misafir'}</CellText>;
            return <CellText muted>{new Date(d.lastPingAt).toLocaleTimeString('tr-TR')}</CellText>;
          }}
        />
      </Section>

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
  hero: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: THEME.goldLight, marginBottom: 6 },
  heroSub: { fontSize: 12, color: THEME.textMuted, lineHeight: 18, marginBottom: SPACING.md },
  heroActions: { flexDirection: 'row', gap: SPACING.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  deviceHint: { marginBottom: SPACING.sm, backgroundColor: THEME.infoBg },
  deviceHintText: { fontSize: 12, color: THEME.textSoft, lineHeight: 18 },
});
