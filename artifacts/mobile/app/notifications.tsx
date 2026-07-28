import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  Linking,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenLayout } from '@/components/ProfileScreenLayout';
import { useColors } from '@/hooks/useColors';
import { useMarkNotificationRead, useNotifications } from '@/lib/hooks';

const STORAGE_KEY = 'pz_notification_prefs';

type Prefs = {
  messages: boolean;
  listings: boolean;
  offers: boolean;
};

const DEFAULT_PREFS: Prefs = { messages: true, listings: true, offers: true };

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const isExpoGo = Constants.appOwnership === 'expo';
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const items = data?.items ?? [];
  const unread = items.filter((n) => !n.isRead).length;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      })
      .catch(() => null);
  }, []);

  const updatePref = async (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const openSystemSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:').catch(() =>
        Alert.alert('Bilgi', 'Ayarlar → Pazaryeri → Bildirimler bölümünden açabilirsiniz'),
      );
    } else {
      Linking.openSettings().catch(() =>
        Alert.alert('Bilgi', 'Telefon ayarlarından Pazaryeri bildirimlerini açabilirsiniz'),
      );
    }
  };

  const handleNotificationPress = async (id: string, type: string, rawData?: string | null) => {
    if (!rawData) return;
    try {
      const parsed = JSON.parse(rawData) as { conversationId?: string; listingId?: string };
      await markRead.mutateAsync(id);
      if (type === 'message' && parsed.conversationId) {
        router.push(`/chat/${parsed.conversationId}`);
      } else if (parsed.listingId) {
        router.push(`/listing/${parsed.listingId}`);
      }
    } catch {
      await markRead.mutateAsync(id);
    }
  };

  return (
    <ProfileScreenLayout title="Bildirimler">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
        {isExpoGo && (
          <View style={[styles.note, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
              Expo Go'da anlık bildirimler sınırlıdır. Tam bildirim desteği için mağaza sürümünü kullanın.
            </Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          UYGULAMA İÇİ BİLDİRİMLER {unread > 0 ? `(${unread} yeni)` : ''}
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : items.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="notifications-off-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Henüz bildirim yok</Text>
          </View>
        ) : (
          items.map((n) => (
            <Pressable
              key={n.id}
              style={[
                styles.notifCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                !n.isRead && { borderColor: colors.primary, borderWidth: 1.5 },
              ]}
              onPress={() => handleNotificationPress(n.id, n.type, n.data)}
            >
              <View style={styles.notifIcon}>
                <Ionicons
                  name={
                    n.type === 'message' ? 'chatbubble' : n.type === 'offer' ? 'pricetag' : 'heart'
                  }
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={styles.notifBody}>
                <Text style={[styles.notifTitle, { color: colors.foreground }]}>{n.title}</Text>
                <Text style={[styles.notifSub, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {n.body}
                </Text>
                <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                  {new Date(n.createdAt).toLocaleString('tr-TR')}
                </Text>
              </View>
            </Pressable>
          ))
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>TERCİHLER</Text>

        <ToggleRow
          title="Mesajlar"
          subtitle="Yeni mesaj geldiğinde bildir"
          value={prefs.messages}
          onChange={(v) => updatePref('messages', v)}
          colors={colors}
        />
        <ToggleRow
          title="İlanlarım"
          subtitle="İlan görüntülenme ve favori bildirimleri"
          value={prefs.listings}
          onChange={(v) => updatePref('listings', v)}
          colors={colors}
        />
        <ToggleRow
          title="Teklifler"
          subtitle="İlanınıza teklif geldiğinde bildir"
          value={prefs.offers}
          onChange={(v) => updatePref('offers', v)}
          colors={colors}
        />

        <Pressable
          style={[styles.systemBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={openSystemSettings}
        >
          <Text style={[styles.systemBtnText, { color: colors.primary }]}>Telefon Bildirim Ayarlarını Aç</Text>
        </Pressable>
      </ScrollView>
    </ProfileScreenLayout>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  colors,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#D1C4E9', true: '#C9A84C' }}
        thumbColor={value ? '#3D1A78' : '#f4f3f4'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  note: { padding: 12, borderRadius: 10, borderWidth: 1 },
  noteText: { fontSize: 13, lineHeight: 19 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  empty: { alignItems: 'center', padding: 24, borderRadius: 14, borderWidth: 1, gap: 8 },
  emptyText: { fontSize: 14 },
  notifCard: { flexDirection: 'row', padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3EFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: { flex: 1, gap: 2 },
  notifTitle: { fontSize: 15, fontWeight: '700' },
  notifSub: { fontSize: 13, lineHeight: 18 },
  notifTime: { fontSize: 11, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 2 },
  systemBtn: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  systemBtnText: { fontSize: 15, fontWeight: '600' },
});
