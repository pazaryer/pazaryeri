import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { authFetch } from '@/lib/api';

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: string | null;
  isRead: boolean;
  createdAt: string;
};

export function useAdminNotifications(enabled = true) {
  return useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => authFetch<{ items: AdminNotification[] }>('/notifications'),
    enabled,
    refetchInterval: Platform.OS === 'web' ? 20_000 : 15_000,
    retry: false,
    refetchOnWindowFocus: true,
  });
}
