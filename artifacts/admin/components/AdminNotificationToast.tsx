import React, { useCallback, useEffect, useRef } from 'react';
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
import type { AdminToastPayload } from '@/lib/admin-toast-bus';
import { playAdminNotificationSound, soundKindForAdminType } from '@/lib/notification-sounds';
import { getAdminNavigationPath } from '@/lib/notifications';
import { THEME } from '@/lib/theme';

const AUTO_HIDE_MS = 7000;

type Props = {
  payload: AdminToastPayload | null;
  onDismiss: () => void;
};

function iconForType(type: string): keyof typeof Ionicons.glyphMap {
  if (type === 'admin_new_listing') return 'pricetag';
  if (type === 'admin_new_user') return 'person-add';
  if (type === 'admin_new_report') return 'flag';
  return 'notifications';
}

export function AdminNotificationToast({ payload, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(140)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(translateY, { toValue: 140, duration: 200, useNativeDriver: true }).start(onDismiss);
  }, [onDismiss, translateY]);

  useEffect(() => {
    if (!payload) return;
    void playAdminNotificationSound(soundKindForAdminType(payload.type));
    translateY.setValue(140);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 72, friction: 11 }).start();
    hideTimer.current = setTimeout(dismiss, AUTO_HIDE_MS);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [payload, dismiss, translateY]);

  if (!payload) return null;

  const open = () => {
    const path = getAdminNavigationPath({
      type: payload.type,
      listingId: payload.listingId,
      userId: payload.userId,
      reportId: payload.reportId,
    });
    dismiss();
    if (path) router.push(path as never);
  };

  return (
    <Animated.View
      style={[styles.wrap, { top: insets.top + 8, transform: [{ translateY }] }]}
      pointerEvents="box-none"
    >
      <Pressable style={styles.card} onPress={open}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconForType(payload.type)} size={22} color={THEME.gold} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>{payload.title}</Text>
          {payload.subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{payload.subtitle}</Text>
          ) : null}
          <Text style={styles.body} numberOfLines={3}>{payload.body}</Text>
        </View>
        <Pressable onPress={dismiss} hitSlop={10}>
          <Ionicons name="close" size={18} color={THEME.textMuted} />
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
    zIndex: 9999,
    elevation: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: THEME.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 12 },
    }),
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '800', color: THEME.goldLight },
  subtitle: { fontSize: 12, fontWeight: '700', color: THEME.accent },
  body: { fontSize: 12, color: THEME.textSoft, lineHeight: 17 },
});
