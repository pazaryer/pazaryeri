import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  attachPushNotificationListeners,
  registerForPushNotifications,
  syncNotificationBadge,
} from '@/lib/notifications';
import { useNotifications } from '@/lib/hooks';

/** Push dinleyicileri + badge senkronu */
export function PushNotificationHandler() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data } = useNotifications(!!user);

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
    const unread = data?.items.filter((n) => !n.isRead).length ?? 0;
    void syncNotificationBadge(unread);
  }, [data?.items, user]);

  return null;
}
