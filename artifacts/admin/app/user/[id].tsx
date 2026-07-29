import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Btn, Card, Loading } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { THEME, SPACING } from '@/lib/theme';

const BADGE_PRESETS = [
  { emoji: '✓', label: 'Onaylı', color: '#2E90FA' },
  { emoji: '🏆', label: 'Güvenilir', color: '#C9A84C' },
  { emoji: '⭐', label: 'VIP', color: '#7C4DFF' },
  { emoji: '💎', label: 'Premium', color: '#12B76A' },
  { emoji: '🛡️', label: 'Korumalı', color: '#2E90FA' },
  { emoji: '🔥', label: 'Popüler', color: '#F79009' },
];

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminFetch<Record<string, unknown>>(`/admin/users/${id}`),
    enabled: !!id,
  });

  async function setRole(role: 'user' | 'moderator' | 'admin') {
    if (profile?.role !== 'admin') {
      Alert.alert('Yetki', 'Rol değiştirmek için süper admin gerekli');
      return;
    }
    await adminFetch(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    refetch();
  }

  async function toggleBan() {
    const banned = Boolean(data?.is_banned);
    await adminFetch(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        isBanned: !banned,
        banReason: banned ? null : 'Admin panelinden engellendi',
      }),
    });
    refetch();
  }

  async function assignBadge(preset: (typeof BADGE_PRESETS)[0]) {
    await adminFetch(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        badgeEmoji: preset.emoji,
        badgeLabel: preset.label,
        badgeColor: preset.color,
      }),
    });
    refetch();
  }

  async function clearBadge() {
    await adminFetch(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ clearBadge: true }),
    });
    refetch();
  }

  if (isLoading || !data) return <Loading />;

  const stats = data.stats as { listings?: number; comments?: number } | undefined;

  return (
    <PageShell title={String(data.name)} subtitle={String(data.email ?? '—')}>
      <View style={styles.badges}>
        {data.badge_emoji ? (
          <Badge text={`${data.badge_emoji} ${data.badge_label ?? ''}`} tone="gold" />
        ) : null}
        {data.is_banned ? <Badge text="ENGELLİ" tone="danger" /> : null}
        <Badge text={String(data.role ?? 'user').toUpperCase()} tone="warning" />
      </View>

      <Card style={styles.infoCard}>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Telefon</Text>
            <Text style={styles.value}>{String(data.phone ?? '—')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Şehir</Text>
            <Text style={styles.value}>{String(data.city ?? '—')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Puan</Text>
            <Text style={styles.value}>⭐ {Number(data.rating ?? 0).toFixed(1)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>İlan / Yorum</Text>
            <Text style={styles.value}>
              {stats?.listings ?? 0} ilan · {stats?.comments ?? 0} yorum
            </Text>
          </View>
        </View>
      </Card>

      <Section title="Rozet Ver">
        <View style={styles.badgeGrid}>
          {BADGE_PRESETS.map((p) => (
            <Btn
              key={p.label}
              label={`${p.emoji} ${p.label}`}
              variant="ghost"
              compact
              onPress={() => assignBadge(p)}
            />
          ))}
        </View>
        <Btn label="Rozeti Kaldır" variant="danger" onPress={clearBadge} />
      </Section>

      <Section title="İşlemler">
        <Btn
          label={data.is_banned ? 'Engeli Kaldır' : 'Kullanıcıyı Engelle'}
          variant={data.is_banned ? 'ghost' : 'danger'}
          onPress={toggleBan}
        />
        {profile?.role === 'admin' && (
          <>
            <Btn label="Admin Yap" variant="gold" onPress={() => setRole('admin')} />
            <Btn label="Moderatör Yap" variant="ghost" onPress={() => setRole('moderator')} />
            <Btn label="Normal Kullanıcı" variant="ghost" onPress={() => setRole('user')} />
          </>
        )}
      </Section>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.md },
  infoCard: { marginBottom: SPACING.md },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  infoItem: { minWidth: '45%', flex: 1 },
  label: { color: THEME.textMuted, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { color: THEME.text, fontSize: 15, fontWeight: '600' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
});
