import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenLayout } from '@/components/ProfileScreenLayout';
import { useColors } from '@/hooks/useColors';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/lib/hooks';

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const isExpoGo = Constants.appOwnership === 'expo';
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const items = data?.items ?? [];
  const unread = items.filter((n) => !n.isRead).length;

  const handleNotificationPress = async (id: string, type: string, rawData?: string | null) => {
    if (!rawData) {
      await markRead.mutateAsync(id);
      return;
    }
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

  const headerRight =
    unread > 0 ? (
      <Pressable
        onPress={() => markAllRead.mutate()}
        disabled={markAllRead.isPending}
        hitSlop={8}
      >
        {markAllRead.isPending ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.markAllText, { color: colors.primary }]}>Tümünü okundu işaretle</Text>
        )}
      </Pressable>
    ) : null;

  return (
    <ProfileScreenLayout title="Bildirimler" headerRight={headerRight}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
        {isExpoGo && Platform.OS !== 'web' && (
          <View style={[styles.note, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
              Expo Go'da anlık bildirimler sınırlıdır. Tam bildirim desteği için mağaza sürümünü kullanın.
            </Text>
          </View>
        )}

        {unread > 0 && (
          <Pressable
            style={[styles.markAllBtn, { backgroundColor: colors.secondary, borderColor: colors.primary }]}
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <Ionicons name="checkmark-done" size={18} color={colors.primary} />
            <Text style={[styles.markAllBtnText, { color: colors.primary }]}>
              Tümünü okundu işaretle ({unread})
            </Text>
          </Pressable>
        )}

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
                  name={n.type === 'message' ? 'chatbubble' : n.type === 'offer' ? 'pricetag' : 'heart'}
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
      </ScrollView>
    </ProfileScreenLayout>
  );
}

const styles = StyleSheet.create({
  note: { padding: 12, borderRadius: 10, borderWidth: 1 },
  noteText: { fontSize: 13, lineHeight: 19 },
  markAllText: { fontSize: 11, fontWeight: '700' },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  markAllBtnText: { fontSize: 14, fontWeight: '700' },
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
});
