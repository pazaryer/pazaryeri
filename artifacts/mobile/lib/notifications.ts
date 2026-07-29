import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { QueryClient } from '@tanstack/react-query';

let handlerConfigured = false;

function getNotificationsModule() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as typeof import('expo-notifications');
}

function configureNotificationHandler() {
  if (handlerConfigured || Constants.appOwnership === 'expo') return;
  handlerConfigured = true;

  const Notifications = getNotificationsModule();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
}

export async function syncNotificationBadge(unreadCount: number): Promise<void> {
  if (Constants.appOwnership === 'expo' || Platform.OS === 'web') return;
  try {
    const Notifications = getNotificationsModule();
    await Notifications.setBadgeCountAsync(Math.max(0, unreadCount));
  } catch {
    /* ignore */
  }
}

export type PushNavigationData = {
  conversationId?: string;
  listingId?: string;
  screen?: string;
  type?: string;
};

export function parsePushData(raw: unknown): PushNavigationData {
  if (!raw || typeof raw !== 'object') return {};
  const d = raw as Record<string, unknown>;
  return {
    conversationId: typeof d.conversationId === 'string' ? d.conversationId : undefined,
    listingId: typeof d.listingId === 'string' ? d.listingId : undefined,
    screen: typeof d.screen === 'string' ? d.screen : undefined,
    type: typeof d.type === 'string' ? d.type : undefined,
  };
}

export function getPushNavigationPath(data: PushNavigationData): string | null {
  if (data.type === 'message' && data.conversationId) {
    return `/chat/${data.conversationId}`;
  }
  if (data.listingId) return `/listing/${data.listingId}`;
  if (data.screen === 'explore') return '/(tabs)/explore';
  if (data.screen === 'post') return '/(tabs)/post';
  if (data.screen === 'messages') return '/(tabs)/messages';
  if (data.screen === 'home') return '/(tabs)';
  return '/notifications';
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Constants.appOwnership === 'expo') return null;

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
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Pazaryeri',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3D1A78',
    });
    await Notifications.setNotificationChannelAsync('engagement', {
      name: 'Pazaryeri Hatırlatmalar',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150, 100, 150],
      lightColor: '#3D1A78',
    });
  }

  const projectId = getProjectId();
  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenData.data;

  try {
    const { apiFetch } = await import('./api');
    await apiFetch('/users/me/push-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
  } catch {
    /* auth hazır değilse sonra tekrar denenecek */
  }

  return token;
}

export function attachPushNotificationListeners(
  queryClient: QueryClient,
  navigate: (path: string) => void,
): () => void {
  if (Constants.appOwnership === 'expo' || Platform.OS === 'web') {
    return () => {};
  }

  configureNotificationHandler();
  const Notifications = getNotificationsModule();

  const receivedSub = Notifications.addNotificationReceivedListener(() => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = parsePushData(response.notification.request.content.data);
    const path = getPushNavigationPath(data);
    if (path) navigate(path);
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  });

  void Notifications.getLastNotificationResponseAsync().then((last) => {
    if (!last) return;
    const data = parsePushData(last.notification.request.content.data);
    const path = getPushNavigationPath(data);
    if (path) navigate(path);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
