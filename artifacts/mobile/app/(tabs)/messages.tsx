import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useConversations, formatLastActive } from '@/lib/hooks';

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const paddingTop = isWeb ? 67 : insets.top;

  const { data, isLoading, refetch, isRefetching } = useConversations();
  const messages = data?.items ?? [];
  const totalUnread = useMemo(() => messages.reduce((s, m) => s + m.unreadCount, 0), [messages]);

  const renderItem = ({ item }: { item: (typeof messages)[0] }) => (
    <Pressable
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.thumbWrap}>
        {item.listingImage ? (
          <Image source={{ uri: item.listingImage }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: colors.secondary }]}>
            <Ionicons name="image-outline" size={20} color={colors.mutedForeground} />
          </View>
        )}
        <Image
          source={{ uri: item.otherUser.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(item.otherUser.name)}` }}
          style={styles.avatar}
        />
        {item.otherUser.isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {item.otherUser.name}
          </Text>
          <Text style={[styles.time, { color: item.unreadCount > 0 ? colors.primary : colors.mutedForeground }]}>
            {item.lastMessageAt
              ? new Date(item.lastMessageAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              : ''}
          </Text>
        </View>
        <Text style={[styles.listingTitle, { color: colors.primary }]} numberOfLines={1}>
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
        <Text style={[styles.presence, { color: colors.mutedForeground }]}>
          {formatLastActive(item.otherUser.lastActiveAt, item.otherUser.isOnline)}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#3D1A78', '#1A0A2E']} style={[styles.hero, { paddingTop: paddingTop + 8 }]}>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Mesajlar</Text>
          {totalUnread > 0 && (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{totalUnread} yeni</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz mesaj yok</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Bir ilana mesaj göndererek sohbet başlatın
              </Text>
              <Pressable style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)/explore')}>
                <Text style={styles.emptyBtnText}>İlanları Keşfet</Text>
              </Pressable>
            </View>
          }
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 100, gap: 8 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  heroBadge: { backgroundColor: '#C9A84C', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  heroBadgeText: { color: '#1A0A2E', fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', padding: 12, borderRadius: 14, borderWidth: 1, gap: 12 },
  thumbWrap: { position: 'relative' },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatar: { position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#FFF' },
  onlineDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFF' },
  content: { flex: 1, justifyContent: 'center', gap: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', flex: 1, paddingRight: 8 },
  time: { fontSize: 11 },
  listingTitle: { fontSize: 11, fontWeight: '600' },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  messageText: { fontSize: 13, flex: 1 },
  badge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  presence: { fontSize: 10, marginTop: 2 },
  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  emptySub: { fontSize: 14, textAlign: 'center' },
  emptyBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyBtnText: { color: '#FFF', fontWeight: '700' },
});
