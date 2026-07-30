import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  attachAdminPushListeners,
  registerAdminPushNotifications,
  syncAdminBadge,
} from '@/lib/notifications';
import { useAdminNotifications } from '@/lib/hooks';

export function AdminPushNotificationHandler() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data } = useAdminNotifications(!!profile);

  const unread = data?.items.filter((n) => !n.isRead && n.type.startsWith('admin_')).length ?? 0;

  useEffect(() => {
    if (Platform.OS === 'web' || !profile) return;
    void registerAdminPushNotifications();
    const retry = setInterval(() => {
      void registerAdminPushNotifications();
    }, 120_000);
    return () => clearInterval(retry);
  }, [profile]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    return attachAdminPushListeners(queryClient, (path) => {
      router.push(path as never);
    });
  }, [queryClient, router]);

  useEffect(() => {
    if (Platform.OS === 'web' || !profile) return;
    void syncAdminBadge(unread);
  }, [unread, profile]);

  return null;
}
