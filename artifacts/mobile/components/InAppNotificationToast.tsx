import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BRAND } from '@/constants/brand';
import type { InAppToastPayload } from '@/lib/in-app-toast-bus';
import { playInAppNotificationSound } from '@/lib/notification-sounds';
import { getPushNavigationPath, parsePushData } from '@/lib/notifications';

const AUTO_HIDE_MS = 6000;

type Props = {
  payload: InAppToastPayload | null;
  onDismiss: () => void;
};

function iconForType(type: string): keyof typeof Ionicons.glyphMap {
  if (type === 'favorite' || type === 'favorite_update') return 'heart';
  if (type === 'offer') return 'pricetag';
  if (type === 'message') return 'chatbubble';
  return 'notifications';
}

export function InAppNotificationToast({ payload, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(120)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(translateY, { toValue: 120, duration: 200, useNativeDriver: true }).start(onDismiss);
  }, [onDismiss, translateY]);

  useEffect(() => {
    if (!payload) return;
    void playInAppNotificationSound(
      payload.type === 'favorite' || payload.type === 'favorite_update' ? 'favorite' : 'popup',
    );
    translateY.setValue(120);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 72, friction: 11 }).start();
    hideTimer.current = setTimeout(dismiss, AUTO_HIDE_MS);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [payload, dismiss, translateY]);

  if (!payload) return null;

  const open = () => {
    const path = getPushNavigationPath({
      ...parsePushData({ type: payload.type, listingId: payload.listingId }),
      type: payload.type,
      listingId: payload.listingId,
    });
    dismiss();
    if (path) router.push(path as never);
  };

  return (
    <Animated.View
      style={[styles.wrap, { bottom: insets.bottom + 72, transform: [{ translateY }] }]}
      pointerEvents="box-none"
    >
      <Pressable style={styles.card} onPress={open}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconForType(payload.type)} size={22} color={BRAND.primary} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>{payload.title}</Text>
          {payload.subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{payload.subtitle}</Text>
          ) : null}
          <Text style={styles.body} numberOfLines={2}>{payload.body}</Text>
        </View>
        <Pressable onPress={dismiss} hitSlop={10}>
          <Ionicons name="close" size={18} color="#9D8BB5" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9998,
    elevation: 18,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E0F4',
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#3D1A78',
        shadowOpacity: 0.14,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 8 },
    }),
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: BRAND.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700', color: '#1A0A2E' },
  subtitle: { fontSize: 11, fontWeight: '600', color: BRAND.primary },
  body: { fontSize: 12, color: '#5C4D6E', lineHeight: 17 },
});
