import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { WebShell } from './WebShell';
import { WebPage } from './WebPage';
import { useConversations } from '@/lib/hooks';

export function WebMessagesPage() {
  const router = useRouter();
  const { data, isLoading } = useConversations();
  const messages = data?.items ?? [];

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
              <Pressable
                key={item.id}
                style={[styles.row, index < messages.length - 1 && styles.rowBorder]}
                onPress={() => router.push(`/chat/${item.id}`)}
              >
                <Image
                  source={{
                    uri:
                      item.otherUser.avatar ??
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(item.otherUser.name)}&background=3D1A78&color=fff`,
                  }}
                  style={styles.avatar}
                />
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
    padding: 20,
    gap: 16,
    width: '100%',
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0EBF8' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  content: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#1A0A2E' },
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
