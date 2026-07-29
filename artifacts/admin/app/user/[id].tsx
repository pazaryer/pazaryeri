import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Btn, Card, Loading, Screen, Subtitle, Title } from '@/components/ui';
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

  return (
    <Screen>
      <ScrollView>
        <Title>{String(data.name)}</Title>
        <Subtitle>{String(data.email ?? '—')}</Subtitle>
        <View style={styles.badges}>
          {data.badge_emoji ? (
            <Badge text={`${data.badge_emoji} ${data.badge_label ?? ''}`} tone="success" />
          ) : null}
          {data.is_banned ? <Badge text="ENGELLİ" tone="danger" /> : null}
          <Badge text={String(data.role ?? 'user').toUpperCase()} tone="warning" />
        </View>

        <Card style={styles.card}>
          <Text style={styles.label}>Telefon</Text>
          <Text style={styles.value}>{String(data.phone ?? '—')}</Text>
          <Text style={styles.label}>Şehir</Text>
          <Text style={styles.value}>{String(data.city ?? '—')}</Text>
          <Text style={styles.label}>Puan</Text>
          <Text style={styles.value}>⭐ {Number(data.rating ?? 0).toFixed(1)}</Text>
          <Text style={styles.label}>İlan / Yorum</Text>
          <Text style={styles.value}>
            {(data.stats as { listings?: number })?.listings ?? 0} ilan ·{' '}
            {(data.stats as { comments?: number })?.comments ?? 0} yorum
          </Text>
        </Card>

        <Text style={styles.section}>🏅 Rozet Ver (isim önünde görünür)</Text>
        {BADGE_PRESETS.map((p) => (
          <Btn key={p.label} label={`${p.emoji} ${p.label}`} variant="ghost" onPress={() => assignBadge(p)} />
        ))}
        <Btn label="Rozeti Kaldır" variant="danger" onPress={clearBadge} />

        <Text style={styles.section}>İşlemler</Text>
        <Btn
          label={data.is_banned ? 'Engeli Kaldır' : 'Kullanıcıyı Engelle'}
          variant={data.is_banned ? 'ghost' : 'danger'}
          onPress={toggleBan}
        />
        {profile?.role === 'admin' && (
          <>
            <Btn label="Admin Yap" variant="ghost" onPress={() => setRole('admin')} />
            <Btn label="Moderatör Yap" variant="ghost" onPress={() => setRole('moderator')} />
            <Btn label="Normal Kullanıcı" variant="ghost" onPress={() => setRole('user')} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', gap: 6, marginBottom: SPACING.md },
  card: { marginBottom: SPACING.md, gap: 4 },
  label: { color: THEME.textMuted, fontSize: 11, marginTop: 8 },
  value: { color: THEME.text, fontSize: 15 },
  section: { color: THEME.gold, fontWeight: '700', marginVertical: SPACING.md },
});
