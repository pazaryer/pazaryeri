import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Btn, Card, Input, Loading } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { THEME, SPACING } from '@/lib/theme';
import { useState } from 'react';

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
  const router = useRouter();
  const { profile } = useAuth();
  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminFetch<Record<string, unknown>>(`/admin/users/${id}`),
    enabled: !!id,
  });

  async function patchUser(body: Record<string, unknown>) {
    await adminFetch(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    refetch();
  }

  async function setRole(role: 'user' | 'moderator' | 'admin') {
    if (profile?.role !== 'admin') {
      Alert.alert('Yetki', 'Rol değiştirmek için süper admin gerekli');
      return;
    }
    await patchUser({ role });
  }

  async function toggleBan() {
    const banned = Boolean(data?.is_banned);
    await patchUser({
      isBanned: !banned,
      banReason: banned ? null : 'Admin panelinden engellendi',
    });
  }

  async function toggleVerified() {
    await patchUser({ isVerified: !data?.is_verified });
  }

  async function saveName() {
    const name = editName.trim();
    if (name.length < 2) {
      Alert.alert('Hata', 'İsim en az 2 karakter olmalı');
      return;
    }
    await patchUser({ name });
    setEditing(false);
  }

  async function assignBadge(preset: (typeof BADGE_PRESETS)[0]) {
    await patchUser({
      badgeEmoji: preset.emoji,
      badgeLabel: preset.label,
      badgeColor: preset.color,
    });
  }

  async function clearBadge() {
    await patchUser({ clearBadge: true });
  }

  function confirmDelete() {
    if (profile?.role !== 'admin') {
      Alert.alert('Yetki', 'Kullanıcı silmek için süper admin gerekli');
      return;
    }
    Alert.alert(
      'Hesabı Kalıcı Sil',
      `${String(data?.name)} ve tüm verileri (ilanlar, mesajlar, yorumlar) kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kalıcı Sil',
          style: 'destructive',
          onPress: () => void doDelete(),
        },
      ],
    );
  }

  async function doDelete() {
    try {
      await adminFetch(`/admin/users/${id}`, { method: 'DELETE' });
      Alert.alert('Silindi', 'Kullanıcı hesabı kalıcı olarak kaldırıldı.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Silinemedi');
    }
  }

  if (isLoading || !data) return <Loading />;

  const stats = data.stats as { listings?: number; comments?: number } | undefined;

  return (
    <PageShell showBack title={String(data.name)} subtitle={String(data.email ?? '—')}>
      <View style={styles.badges}>
        {data.badge_emoji ? (
          <Badge text={`${data.badge_emoji} ${data.badge_label}`} tone="gold" />
        ) : null}
        {data.is_verified ? <Badge text="Doğrulanmış" tone="success" /> : null}
        {data.is_banned ? <Badge text="Engelli" tone="danger" /> : null}
        <Badge text={String(data.role ?? 'user')} />
      </View>

      <Section title="Profil Bilgileri">
        <Card>
          {editing ? (
            <>
              <Text style={styles.fieldLabel}>Ad Soyad</Text>
              <Input value={editName} onChangeText={setEditName} placeholder="Ad Soyad" />
              <View style={styles.row}>
                <Btn label="Kaydet" onPress={() => void saveName()} />
                <Btn label="İptal" variant="ghost" onPress={() => setEditing(false)} />
              </View>
            </>
          ) : (
            <>
              <InfoRow label="Ad" value={String(data.name)} />
              <InfoRow label="E-posta" value={String(data.email ?? '—')} />
              <InfoRow label="Telefon" value={String(data.phone ?? '—')} />
              <InfoRow label="Şehir" value={String(data.city ?? '—')} />
              <InfoRow label="Puan" value={String(data.rating ?? '0')} />
              <InfoRow label="Kayıt" value={new Date(String(data.created_at)).toLocaleDateString('tr-TR')} />
              <Btn
                label="İsmi Düzenle"
                variant="ghost"
                onPress={() => {
                  setEditName(String(data.name));
                  setEditing(true);
                }}
              />
            </>
          )}
        </Card>
      </Section>

      <Section title="İstatistikler">
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNum}>{stats?.listings ?? 0}</Text>
            <Text style={styles.statLbl}>İlan</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNum}>{stats?.comments ?? 0}</Text>
            <Text style={styles.statLbl}>Yorum</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNum}>{String(data.total_sales ?? 0)}</Text>
            <Text style={styles.statLbl}>Satış</Text>
          </Card>
        </View>
      </Section>

      <Section title="Moderasyon">
        <Card>
          <View style={styles.row}>
            <Btn label={data.is_banned ? 'Engeli Kaldır' : 'Engelle'} variant="ghost" onPress={() => void toggleBan()} />
            <Btn
              label={data.is_verified ? 'Doğrulamayı Kaldır' : 'Doğrula'}
              variant="ghost"
              onPress={() => void toggleVerified()}
            />
          </View>
          {profile?.role === 'admin' ? (
            <View style={styles.row}>
              <Btn label="Kullanıcı" variant="ghost" onPress={() => void setRole('user')} />
              <Btn label="Moderatör" variant="ghost" onPress={() => void setRole('moderator')} />
              <Btn label="Admin" variant="ghost" onPress={() => void setRole('admin')} />
            </View>
          ) : null}
        </Card>
      </Section>

      <Section title="Rozet">
        <View style={styles.badgeGrid}>
          {BADGE_PRESETS.map((p) => (
            <Btn key={p.label} label={`${p.emoji} ${p.label}`} variant="ghost" onPress={() => void assignBadge(p)} />
          ))}
        </View>
        <Btn label="Rozeti Kaldır" variant="ghost" onPress={() => void clearBadge()} />
      </Section>

      {profile?.role === 'admin' ? (
        <Section title="Tehlikeli Bölge">
          <Card>
            <Text style={styles.dangerHint}>
              Kullanıcı hesabı ve tüm verileri kalıcı olarak silinir. Web/mobil hesap silme ile aynı işlem.
            </Text>
            <Btn label="Hesabı Kalıcı Sil" variant="danger" onPress={confirmDelete} />
          </Card>
        </Section>
      ) : null}
    </PageShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statNum: { fontSize: 22, fontWeight: '800', color: THEME.primary },
  statLbl: { fontSize: 12, color: THEME.textMuted, marginTop: 4 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: THEME.border },
  infoLabel: { fontSize: 13, color: THEME.textMuted },
  infoValue: { fontSize: 13, fontWeight: '600', color: THEME.text, flexShrink: 1, textAlign: 'right' },
  dangerHint: { fontSize: 13, color: THEME.textMuted, lineHeight: 18, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: THEME.textMuted, marginBottom: 6 },
});
