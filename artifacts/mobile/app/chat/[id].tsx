import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useColors } from '@/hooks/useColors';
import { useMessages, useSendMessage, useDeleteMessage, useDeleteConversation, useHeartbeat, formatLastActive } from '@/lib/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';
import { WebShell } from '@/components/web/WebShell';
import { showConfirm } from '@/lib/web-alert';

function ChatContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const { data, isLoading } = useMessages(conversationId ?? '');
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const deleteConversation = useDeleteConversation();
  const heartbeat = useHeartbeat();
  const [text, setText] = useState('');

  const messages = data?.items ?? [];
  const conversation = data?.conversation;

  useEffect(() => {
    heartbeat.mutate();
    const t = setInterval(() => heartbeat.mutate(), 60_000);
    return () => clearInterval(t);
  }, [conversationId]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToEnd();
  }, [messages.length, scrollToEnd]);

  const handleSend = async () => {
    if (!text.trim() || !conversationId) return;
    const content = text.trim();
    setText('');
    try {
      await sendMessage.mutateAsync({ conversationId, content });
      scrollToEnd();
    } catch {
      setText(content);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!conversationId) return;
    const doDelete = async () => {
      try {
        await deleteMessage.mutateAsync({ messageId, conversationId });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Mesaj silinemedi';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Hata', msg);
      }
    };
    if (Platform.OS === 'web') {
      showConfirm('Mesajı Sil', 'Bu mesaj kalıcı olarak silinecek. Emin misiniz?', doDelete);
    } else {
      Alert.alert('Mesajı Sil', 'Bu mesaj kalıcı olarak silinecek. Emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => void doDelete() },
      ]);
    }
  };

  const handleDeleteConversation = () => {
    if (!conversationId) return;
    const doDelete = async () => {
      try {
        await deleteConversation.mutateAsync(conversationId);
        router.replace('/mesajlar');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Sohbet silinemedi';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Hata', msg);
      }
    };
    if (Platform.OS === 'web') {
      showConfirm('Sohbeti Sil', 'Tüm mesajlar kalıcı olarak silinecek. Emin misiniz?', doDelete);
    } else {
      Alert.alert('Sohbeti Sil', 'Tüm mesajlar kalıcı olarak silinecek. Emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => void doDelete() },
      ]);
    }
  };

  const inputBar = (
    <View
      style={[
        styles.inputBar,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border },
        ]}
        placeholder="Mesajınızı yazın..."
        placeholderTextColor={colors.mutedForeground}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={2000}
        onFocus={scrollToEnd}
      />
      <Pressable
        style={[styles.sendButton, { backgroundColor: colors.primary }, !text.trim() && { opacity: 0.5 }]}
        onPress={handleSend}
        disabled={!text.trim() || sendMessage.isPending}
      >
        {sendMessage.isPending ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Ionicons name="send" size={20} color="#FFF" />
        )}
      </Pressable>
    </View>
  );

  const renderMessage = ({ item }: { item: (typeof messages)[number] }) => {
    const isMine = item.senderId === profile?.id;
    const otherAvatar = conversation?.otherUser;
    return (
      <Pressable
        style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowTheir]}
        onLongPress={isMine ? () => handleDeleteMessage(item.id) : undefined}
        delayLongPress={400}
      >
        {!isMine && otherAvatar && (
          <UserAvatar name={otherAvatar.name} avatar={otherAvatar.avatar} size={28} />
        )}
        <View
          style={[
            styles.bubble,
            isMine ? styles.myBubble : styles.theirBubble,
            { backgroundColor: isMine ? colors.primary : colors.card },
          ]}
        >
          <Text style={{ color: isMine ? '#FFF' : colors.foreground, fontSize: 15 }}>{item.content}</Text>
          <View style={styles.bubbleFooter}>
            <Text style={[styles.time, { color: isMine ? 'rgba(255,255,255,0.7)' : colors.mutedForeground }]}>
              {new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              {isMine && (item.isRead ? ' · Okundu' : item.deliveredAt ? ' · İletildi' : ' · Gönderildi')}
            </Text>
            {isMine && (
              <Pressable
                onPress={() => handleDeleteMessage(item.id)}
                hitSlop={8}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={14} color={isMine ? 'rgba(255,255,255,0.8)' : colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const messageList = (
    <FlatList
      ref={flatListRef}
      style={styles.flex}
      data={messages}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      onContentSizeChange={scrollToEnd}
      renderItem={renderMessage}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? 12 : insets.top + 8,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </Pressable>
        {conversation?.otherUser && (
          <UserAvatar
            name={conversation.otherUser.name}
            avatar={conversation.otherUser.avatar}
            size={36}
            online={conversation.otherUser.isOnline}
          />
        )}
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {conversation?.otherUser.name ?? 'Sohbet'}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {conversation?.otherUser.isOnline
              ? 'Çevrimiçi'
              : formatLastActive(conversation?.otherUser.lastActiveAt, conversation?.otherUser.isOnline)}
            {conversation?.listingTitle ? ` · ${conversation.listingTitle}` : ''}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
        <Pressable onPress={handleDeleteConversation} hitSlop={12} disabled={deleteConversation.isPending}>
          {deleteConversation.isPending ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <Ionicons name="trash-outline" size={22} color="#C62828" />
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : Platform.OS === 'ios' ? (
        <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={0}>
          {messageList}
        </KeyboardAvoidingView>
      ) : (
        messageList
      )}

      {Platform.OS === 'web' ? (
        inputBar
      ) : (
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>{inputBar}</KeyboardStickyView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSpacer: { width: 0 },
  headerTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  headerSub: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 88, flexGrow: 1 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 8, maxWidth: '88%' },
  msgRowMine: { alignSelf: 'flex-end' },
  msgRowTheir: { alignSelf: 'flex-start' },
  bubble: { padding: 12, borderRadius: 16, maxWidth: '100%' },
  myBubble: { borderBottomRightRadius: 4 },
  theirBubble: { borderBottomLeftRadius: 4 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 4 },
  time: { fontSize: 10 },
  deleteBtn: { padding: 2 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  webWrap: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' as const, minHeight: 500 },
});

export default function ChatScreen() {
  if (Platform.OS === 'web') {
    return (
      <WebShell hideFooter>
        <View style={styles.webWrap}>
          <ChatContent />
        </View>
      </WebShell>
    );
  }
  return <ChatContent />;
}
