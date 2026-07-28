import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { WebShell } from './WebShell';
import { WebPage } from './WebPage';
import { useConversations, useDeleteConversation, formatLastActive } from '@/lib/hooks';
import { showConfirm } from '@/lib/web-alert';

export function WebMessagesPage() {
  const router = useRouter();
  const { data, isLoading } = useConversations();
  const deleteConversation = useDeleteConversation();
  const messages = data?.items ?? [];

  const handleDeleteConversation = (conversationId: string) => {
    const doDelete = async () => {
      try {
        await deleteConversation.mutateAsync(conversationId);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Sohbet silinemedi';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Hata', msg);
      }
    };
    showConfirm('Sohbeti Sil', 'Tüm mesajlar kalıcı olarak silinecek. Emin misiniz?', doDelete);
  };

  return (
    <WebShell hideFooter>
      <WebPage title="Mesajlar" subtitle="Satıcılar ve alıcılarla sohbetleriniz">
        <View style={styles.card}>
          {isLoading ? (
            <ActivityIndicator color="#3D1A78" style={{ padding: 40 }} />
          ) : messages.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>Henüz mesajınız yok</Text>
              <Text style={styles.emptyDesc}>
                Bir ilana mesaj gönderdiğinizde sohbetleriniz burada görünür
              </Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/kesfet')}>
                <Text style={styles.emptyBtnText}>İlanları Keşfet</Text>
              </Pressable>
            </View>
          ) : (
            messages.map((item, index) => (
              <View
                key={item.id}
                style={[styles.row, index < messages.length - 1 && styles.rowBorder]}
              >
                <Pressable style={styles.rowPress} onPress={() => router.push(`/chat/${item.id}`)}>
                {item.listingImage ? (
                  <Image source={{ uri: item.listingImage }} style={styles.listingThumb} />
                ) : null}
                <View style={styles.avatarWrap}>
                  <Image
                    source={{
                      uri:
                        item.otherUser.avatar ??
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(item.otherUser.name)}&background=3D1A78&color=fff`,
                    }}
                    style={styles.avatar}
                  />
                  {item.otherUser.isOnline && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.content}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name}>{item.otherUser.name}</Text>
                    <Text style={[styles.time, item.unreadCount > 0 && styles.timeUnread]}>
                      {item.lastMessageAt
                        ? new Date(item.lastMessageAt).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </Text>
                  </View>
                  <Text style={styles.presence}>
                    {formatLastActive(item.otherUser.lastActiveAt, item.otherUser.isOnline)}
                  </Text>
                  <Text style={styles.listingTitle} numberOfLines={1}>
                    {item.listingTitle}
                  </Text>
                  <View style={styles.messageRow}>
                    <Text
                      style={[styles.messageText, item.unreadCount > 0 && styles.messageUnread]}
                      numberOfLines={1}
                    >
                      {item.lastMessage ?? 'Sohbet başlatıldı'}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
                </Pressable>
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteConversation(item.id)}
                  disabled={deleteConversation.isPending}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </WebPage>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2D9F0',
    overflow: 'hidden',
    width: '100%',
  },
  empty: { padding: 60, alignItems: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A0A2E' },
  emptyDesc: { fontSize: 14, color: '#7A6B8A', textAlign: 'center', maxWidth: 360 },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#3D1A78',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#FFFFFF', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    width: '100%',
  },
  rowPress: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  deleteIcon: { fontSize: 18 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0EBF8' },
  listingThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#EDE8F5' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  content: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#1A0A2E' },
  presence: { fontSize: 11, color: '#22C55E', fontWeight: '600' },
  time: { fontSize: 12, color: '#7A6B8A' },
  timeUnread: { color: '#3D1A78', fontWeight: '700' },
  listingTitle: { fontSize: 12, color: '#7A6B8A' },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  messageText: { flex: 1, fontSize: 14, color: '#7A6B8A' },
  messageUnread: { color: '#1A0A2E', fontWeight: '600' },
  badge: {
    backgroundColor: '#3D1A78',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  chevron: { color: '#C4B5D4', fontSize: 22, fontWeight: '300' },
});
