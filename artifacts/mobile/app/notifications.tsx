import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenLayout } from '@/components/ProfileScreenLayout';
import { useColors } from '@/hooks/useColors';
import {
  useDeleteAllNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/lib/hooks';
import { getPushNavigationPath, parsePushData } from '@/lib/notifications';

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteAll = useDeleteAllNotifications();
  const items = data?.items ?? [];
  const unread = items.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  const handleDeleteAll = () => {
    const runDelete = () => deleteAll.mutate();
    if (Platform.OS === 'web') {
      if (
        window.confirm(
          'Zildeki tüm bildirimler kalıcı olarak silinecek. Devam etmek istiyor musunuz?',
        )
      ) {
        runDelete();
      }
      return;
    }
    Alert.alert(
      'Tüm bildirimleri sil',
      'Zildeki tüm bildirimler kalıcı olarak silinecek. Devam etmek istiyor musunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Tümünü sil', style: 'destructive', onPress: runDelete },
      ],
    );
  };

  const handleNotificationPress = async (id: string, type: string, rawData?: string | null) => {
    await markRead.mutateAsync(id);
    if (!rawData) return;
    try {
      const parsed = parsePushData(JSON.parse(rawData));
      const path = getPushNavigationPath({ ...parsed, type });
      if (path) router.push(path as never);
    } catch {
      /* ignore */
    }
  };

  const headerRight =
    items.length > 0 ? (
      <View style={styles.headerActions}>
        {unread > 0 && (
          <Pressable onPress={handleMarkAllRead} disabled={markAllRead.isPending} hitSlop={8}>
            {markAllRead.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="checkmark-done" size={22} color={colors.primary} />
            )}
          </Pressable>
        )}
        <Pressable onPress={handleDeleteAll} disabled={deleteAll.isPending} hitSlop={8}>
          {deleteAll.isPending ? (
            <ActivityIndicator size="small" color="#C0392B" />
          ) : (
            <Ionicons name="trash-outline" size={21} color="#C0392B" />
          )}
        </Pressable>
      </View>
    ) : null;

  return (
    <ProfileScreenLayout title="Bildirimler" headerRight={headerRight} scroll={false}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.length > 0 && (
          <View style={styles.actionRow}>
            {unread > 0 && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.secondary, borderColor: colors.primary }]}
                onPress={handleMarkAllRead}
                disabled={markAllRead.isPending}
              >
                <Ionicons name="checkmark-done" size={16} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  Tümünü okundu işaretle ({unread})
                </Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={handleDeleteAll}
              disabled={deleteAll.isPending}
            >
              <Ionicons name="trash-outline" size={16} color="#C0392B" />
              <Text style={styles.deleteBtnText}>Tümünü sil</Text>
            </Pressable>
          </View>
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
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 12, paddingBottom: 32 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: '48%',
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  deleteBtn: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F5C6C6',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: '#C0392B' },
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
