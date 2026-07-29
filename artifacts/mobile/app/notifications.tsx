import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenLayout } from '@/components/ProfileScreenLayout';
import { WebShell } from '@/components/web/WebShell';
import { SeoHead } from '@/components/SeoHead';
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const items = data?.items ?? [];
  const unread = items.filter((n) => !n.isRead).length;
  const busy = markAllRead.isPending || deleteAll.isPending;

  const showError = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Okundu işaretlenemedi');
    }
  };

  const runDeleteAll = async () => {
    setDeleteModalOpen(false);
    try {
      await deleteAll.mutateAsync();
    } catch (err) {
      showError('Silinemedi', err instanceof Error ? err.message : 'Bildirimler silinemedi');
    }
  };

  const handleDeleteAll = () => {
    if (Platform.OS === 'web') {
      if (
        window.confirm('Zildeki tüm bildirimler kalıcı olarak silinecek. Devam etmek istiyor musunuz?')
      ) {
        void runDeleteAll();
      }
      return;
    }
    setDeleteModalOpen(true);
  };

  const handleNotificationPress = async (id: string, type: string, rawData?: string | null) => {
    try {
      await markRead.mutateAsync(id);
    } catch {
      /* ignore */
    }
    if (!rawData) return;
    try {
      const parsed = parsePushData(JSON.parse(rawData));
      const path = getPushNavigationPath({ ...parsed, type });
      if (path) router.push(path as never);
    } catch {
      /* ignore */
    }
  };

  const panel = (
    <ProfileScreenLayout title="Bildirimler" scroll={false}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.length > 0 && (
          <View style={styles.actionRow}>
            <Pressable
              style={[
                styles.actionBtn,
                { backgroundColor: colors.secondary, borderColor: colors.primary },
                busy && styles.actionBtnDisabled,
              ]}
              onPress={() => void handleMarkAllRead()}
              disabled={busy}
            >
              {markAllRead.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="checkmark-done" size={16} color={colors.primary} />
              )}
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                Tümünü okundu yap{unread > 0 ? ` (${unread})` : ''}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.deleteBtn, busy && styles.actionBtnDisabled]}
              onPress={handleDeleteAll}
              disabled={busy}
            >
              {deleteAll.isPending ? (
                <ActivityIndicator size="small" color="#C0392B" />
              ) : (
                <Ionicons name="trash-outline" size={16} color="#C0392B" />
              )}
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

      <Modal visible={deleteModalOpen} transparent animationType="fade" onRequestClose={() => setDeleteModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDeleteModalOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Tümünü sil?</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              Zildeki tüm bildirimler kalıcı olarak silinecek.
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setDeleteModalOpen(false)}>
                <Text style={styles.modalBtnCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnDelete]} onPress={() => void runDeleteAll()}>
                <Text style={styles.modalBtnDeleteText}>Tümünü sil</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ProfileScreenLayout>
  );

  if (Platform.OS === 'web') {
    return (
      <WebShell>
        <SeoHead title="Bildirimler" description="Pazaryeri bildirimleriniz." path="/notifications" noindex />
        {panel}
      </WebShell>
    );
  }

  return panel;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 12, paddingBottom: 32 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontSize: 12, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  deleteBtn: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F5C6C6',
  },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: '#C0392B', textAlign: 'center' },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalBody: { fontSize: 14, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: { backgroundColor: '#F0F0F0' },
  modalBtnCancelText: { fontWeight: '700', color: '#444' },
  modalBtnDelete: { backgroundColor: '#C0392B' },
  modalBtnDeleteText: { fontWeight: '700', color: '#FFF' },
});
