import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  attachPushNotificationListeners,
  registerForPushNotifications,
  syncNotificationBadge,
} from '@/lib/notifications';
import { useNotifications, useConversations } from '@/lib/hooks';

/** Push dinleyicileri + badge senkronu */
export function PushNotificationHandler() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: notifData } = useNotifications(!!user);
  const { data: convoData } = useConversations(!!user);

  const badgeCount = useMemo(() => {
    const unreadNotifs = notifData?.items.filter((n) => !n.isRead).length ?? 0;
    const unreadMessages = (convoData?.items ?? []).reduce((s, c) => s + c.unreadCount, 0);
    return Math.max(unreadNotifs, unreadMessages);
  }, [notifData?.items, convoData?.items]);

  useEffect(() => {
    if (Platform.OS === 'web' || !user) return;
    void registerForPushNotifications();
  }, [user]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    return attachPushNotificationListeners(queryClient, (path) => {
      router.push(path as never);
    });
  }, [queryClient, router]);

  useEffect(() => {
    if (Platform.OS === 'web' || !user) return;
    void syncNotificationBadge(badgeCount);
  }, [badgeCount, user]);

  return null;
}
