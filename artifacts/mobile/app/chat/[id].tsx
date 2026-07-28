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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useColors } from '@/hooks/useColors';
import { useMessages, useSendMessage } from '@/lib/hooks';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const { data, isLoading } = useMessages(conversationId ?? '');
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');

  const messages = data?.items ?? [];
  const headerHeight = insets.top + 56;

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Sohbet</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : (
          <FlatList
            ref={flatListRef}
            style={styles.flex}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 12, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={scrollToEnd}
            renderItem={({ item }) => {
              const isMine = item.senderId === profile?.id;
              return (
                <View
                  style={[
                    styles.bubble,
                    isMine ? styles.myBubble : styles.theirBubble,
                    { backgroundColor: isMine ? colors.primary : colors.card },
                  ]}
                >
                  <Text style={{ color: isMine ? '#FFF' : colors.foreground, fontSize: 15 }}>
                    {item.content}
                  </Text>
                  <Text
                    style={[
                      styles.time,
                      { color: isMine ? 'rgba(255,255,255,0.7)' : colors.mutedForeground },
                    ]}
                  >
                    {new Date(item.createdAt).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              );
            }}
          />
        )}

        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
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
        </KeyboardStickyView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  myBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
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
});
