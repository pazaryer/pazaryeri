import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { QueryClient } from '@tanstack/react-query';
import { showAdminToast } from '@/lib/admin-toast-bus';
import { inAppNotificationKey, shouldShowInAppNotification } from '@/lib/notification-dedup';

let handlerConfigured = false;

const ANDROID_SOUND = 'pazaryeri-push.wav';

function getNotificationsModule() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as typeof import('expo-notifications');
}

function configureNotificationHandler() {
  if (handlerConfigured || Constants.appOwnership === 'expo') return;
  handlerConfigured = true;

  const Notifications = getNotificationsModule();
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = parseAdminPushData(notification.request.content.data);
      const content = notification.request.content;
      const type = data.type ?? 'admin';

      if (!type.startsWith('admin_')) {
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      }

      const key = inAppNotificationKey(type, { id: `push-${notification.request.identifier}` });
      if (!shouldShowInAppNotification(key)) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: true,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }

      showAdminToast({
        id: `push-${notification.request.identifier}`,
        type,
        title: content.title ?? 'Admin Bildirimi',
        subtitle: content.subtitle ?? undefined,
        body: content.body ?? '',
        listingId: data.listingId,
        userId: data.userId,
        reportId: data.reportId,
      });

      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: true,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    },
  });
}

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
}

export type AdminPushData = {
  type?: string;
  listingId?: string;
  userId?: string;
  reportId?: string;
  screen?: string;
};

export function parseAdminPushData(raw: unknown): AdminPushData {
  if (!raw || typeof raw !== 'object') return {};
  const d = raw as Record<string, unknown>;
  const str = (key: string) => (typeof d[key] === 'string' && d[key] ? String(d[key]) : undefined);
  return {
    type: str('type'),
    listingId: str('listingId'),
    userId: str('userId'),
    reportId: str('reportId'),
    screen: str('screen'),
  };
}

export function parseNotificationData(raw: string | null | undefined): AdminPushData {
  if (!raw) return {};
  try {
    return parseAdminPushData(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function getAdminNavigationPath(data: AdminPushData): string | null {
  if (data.type === 'admin_new_listing' && data.listingId) return `/listing/${data.listingId}`;
  if (data.type === 'admin_new_user' && data.userId) return `/user/${data.userId}`;
  if (data.type === 'admin_new_report') return '/(tabs)/reports';
  if (data.screen === 'listing' && data.listingId) return `/listing/${data.listingId}`;
  if (data.screen === 'user' && data.userId) return `/user/${data.userId}`;
  if (data.screen === 'reports') return '/(tabs)/reports';
  return null;
}

async function setupAndroidChannel(Notifications: ReturnType<typeof getNotificationsModule>): Promise<void> {
  await Notifications.setNotificationChannelAsync('admin-alerts', {
    name: 'Admin Uyarıları',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 300, 150, 300],
    lightColor: '#8B5CF6',
    sound: ANDROID_SOUND,
  });
}

export async function registerAdminPushNotifications(): Promise<string | null> {
  if (Constants.appOwnership === 'expo' || Platform.OS === 'web') return null;

  configureNotificationHandler();
  const Notifications = getNotificationsModule();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Device = require('expo-device');

  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await setupAndroidChannel(Notifications);
  }

  const projectId = getProjectId();
  const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const token = tokenData.data;

  try {
    const { authFetch } = await import('@/lib/api');
    await authFetch('/users/me/push-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
  } catch {
    /* retry later */
  }

  return token;
}

export async function syncAdminBadge(unreadCount: number): Promise<void> {
  if (Constants.appOwnership === 'expo' || Platform.OS === 'web') return;
  try {
    const Notifications = getNotificationsModule();
    await Notifications.setBadgeCountAsync(Math.max(0, unreadCount));
  } catch {
    /* ignore */
  }
}

export function attachAdminPushListeners(
  queryClient: QueryClient,
  navigate: (path: string) => void,
): () => void {
  if (Constants.appOwnership === 'expo' || Platform.OS === 'web') {
    return () => {};
  }

  configureNotificationHandler();
  const Notifications = getNotificationsModule();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
  };

  const receivedSub = Notifications.addNotificationReceivedListener(() => invalidate());

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = parseAdminPushData(response.notification.request.content.data);
    const path = getAdminNavigationPath(data);
    if (path) navigate(path);
    invalidate();
  });

  void Notifications.getLastNotificationResponseAsync().then((last) => {
    if (!last) return;
    const data = parseAdminPushData(last.notification.request.content.data);
    const path = getAdminNavigationPath(data);
    if (path) navigate(path);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
