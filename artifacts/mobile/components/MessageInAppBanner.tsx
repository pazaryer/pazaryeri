import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BRAND } from '@/constants/brand';
import { listingThumbImageProps } from '@/lib/listing-image-props';
import type { MessageBannerPayload } from '@/lib/message-banner-bus';
import { useSendMessage } from '@/lib/hooks';

const AUTO_HIDE_MS = 12_000;

type Props = {
  payload: MessageBannerPayload | null;
  onDismiss: () => void;
};

export function MessageInAppBanner({ payload, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sendMessage = useSendMessage();
  const [reply, setReply] = useState('');
  const translateY = useRef(new Animated.Value(-200)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(translateY, { toValue: -220, duration: 220, useNativeDriver: true }).start(() => {
      setReply('');
      onDismiss();
    });
  }, [onDismiss, translateY]);

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(dismiss, AUTO_HIDE_MS);
  }, [dismiss]);

  useEffect(() => {
    if (!payload) return;
    setReply('');
    translateY.setValue(-200);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 68, friction: 11 }).start();
    resetHideTimer();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [payload, resetHideTimer, translateY]);

  const openChat = () => {
    if (!payload) return;
    dismiss();
    router.push(`/chat/${payload.conversationId}` as never);
  };

  const handleSend = async () => {
    if (!payload || !reply.trim() || sendMessage.isPending) return;
    const content = reply.trim();
    setReply('');
    Keyboard.dismiss();
    try {
      await sendMessage.mutateAsync({ conversationId: payload.conversationId, content });
      dismiss();
    } catch {
      setReply(content);
    }
  };

  if (!payload) return null;

  const thumb = payload.listingImage || payload.senderAvatar;

  return (
    <Animated.View
      style={[styles.wrap, { top: insets.top + 8, transform: [{ translateY }] }]}
      pointerEvents="box-none"
    >
      <View style={styles.card}>
        <Pressable style={styles.header} onPress={openChat}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.thumb} {...listingThumbImageProps} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}>
              <Ionicons name="chatbubble" size={20} color={BRAND.primary} />
            </View>
          )}
          <View style={styles.meta}>
            <Text style={styles.sender} numberOfLines={1}>
              {payload.senderName}
            </Text>
            <Text style={styles.listing} numberOfLines={1}>
              {payload.listingTitle}
            </Text>
            <Text style={styles.preview} numberOfLines={2}>
              {payload.messageText}
            </Text>
          </View>
          <Pressable onPress={dismiss} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color="#8A7A9A" />
          </Pressable>
        </Pressable>

        <View style={styles.replyRow}>
          <TextInput
            style={styles.input}
            placeholder="Hızlı yanıt yaz..."
            placeholderTextColor="#9D8BB5"
            value={reply}
            onChangeText={(t) => {
              setReply(t);
              resetHideTimer();
            }}
            onFocus={resetHideTimer}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            maxLength={500}
          />
          <Pressable
            style={[styles.sendBtn, !reply.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!reply.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={16} color="#FFF" />
            )}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#3D1A78',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E0F4',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND.primaryLight,
  },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  meta: { flex: 1, gap: 2 },
  sender: { fontSize: 14, fontWeight: '700', color: '#1A0A2E' },
  listing: { fontSize: 11, fontWeight: '600', color: BRAND.primary },
  preview: { fontSize: 13, color: '#5C4D6E', lineHeight: 18, marginTop: 2 },
  closeBtn: { padding: 4 },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0EBF8',
    paddingTop: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F5FC',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1A0A2E',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
});
