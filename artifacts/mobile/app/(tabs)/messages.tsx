import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useConversations } from '@/lib/hooks';

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const paddingTop = isWeb ? 67 : insets.top + 20;

  const { data, isLoading } = useConversations();
  const messages = data?.items ?? [];

  const renderItem = ({ item }: { item: typeof messages[0] }) => (
    <Pressable
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <Image
        source={{ uri: item.otherUser.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(item.otherUser.name)}` }}
        style={styles.avatar}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.foreground }]}>{item.otherUser.name}</Text>
          <Text style={[styles.time, { color: item.unreadCount > 0 ? colors.primary : colors.mutedForeground }]}>
            {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
        <Text style={[styles.listingTitle, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.listingTitle}
        </Text>
        <View style={styles.messageRow}>
          <Text
            style={[
              styles.messageText,
              { color: item.unreadCount > 0 ? colors.foreground : colors.mutedForeground, fontWeight: item.unreadCount > 0 ? '600' : '400' },
            ]}
            numberOfLines={1}
          >
            {item.lastMessage ?? 'Sohbet başlatıldı'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Mesajlar</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: colors.mutedForeground }}>Henüz mesajınız yok</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 28, fontWeight: 'bold' },
  row: { flexDirection: 'row', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 16 },
  content: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  name: { fontSize: 16, fontWeight: '700' },
  time: { fontSize: 12 },
  listingTitle: { fontSize: 12, marginBottom: 4 },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  messageText: { fontSize: 15, flex: 1, paddingRight: 16 },
  badge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  empty: { padding: 40, alignItems: 'center' },
});
