import { Platform } from 'react-native';
import { getApp, getApps } from 'firebase/app';
import { getFirebaseVapidKey } from '@/lib/firebase';
import { showInAppToast } from '@/lib/in-app-toast-bus';
import { showMessageBanner } from '@/lib/message-banner-bus';
import { inAppNotificationKey, shouldShowInAppNotification } from '@/lib/notification-dedup';
import { parsePushData, getPushNavigationPath } from '@/lib/notifications';

let registered = false;

function parseFcmPayload(payload: {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
}) {
  const data = parsePushData(payload.data ?? {});
  return {
    data,
    title: payload.notification?.title ?? data.type ?? 'Pazaryeri',
    body: payload.notification?.body ?? '',
  };
}

function showForegroundWebNotification(payload: {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
}) {
  const { data, title, body } = parseFcmPayload(payload);

  if (data.type === 'message' && data.conversationId) {
    const key = inAppNotificationKey('message', { conversationId: data.conversationId });
    if (!shouldShowInAppNotification(key)) return;
    showMessageBanner({
      conversationId: data.conversationId,
      listingId: data.listingId ?? '',
      senderName: data.senderName ?? title,
      listingTitle: data.listingTitle ?? 'İlan',
      messageText: data.messageText ?? body,
      senderAvatar: data.senderAvatar,
      listingImage: data.listingImage,
    });
    return;
  }

  const key = inAppNotificationKey(data.type ?? 'default', {
    id: payload.data?.notificationId,
    listingId: data.listingId,
  });
  if (!shouldShowInAppNotification(key)) return;

  showInAppToast({
    id: payload.data?.notificationId ?? `web-${Date.now()}`,
    type: data.type ?? 'default',
    title,
    body,
    listingId: data.listingId,
    subtitle: data.listingTitle,
  });
}

/** Web FCM token kaydı — tarayıcı bildirim izni + service worker */
export async function registerWebPush(): Promise<string | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (registered) return null;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;

  try {
    const permission =
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;

    const { getMessaging, getToken, onMessage, isSupported } = await import('firebase/messaging');
    const supported = await isSupported();
    if (!supported) return null;

    const app = getApps().length > 0 ? getApp() : null;
    if (!app) return null;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: getFirebaseVapidKey(),
      serviceWorkerRegistration: swReg,
    });

    if (!token) return null;

    onMessage(messaging, (payload) => {
      showForegroundWebNotification(payload);
    });

    const { apiFetch } = await import('./api');
    await apiFetch('/users/me/push-token', {
      method: 'POST',
      body: JSON.stringify({ token: `fcm:${token}`, platform: 'web' }),
    });

    registered = true;
    return token;
  } catch (err) {
    console.warn('[Pazaryeri] Web push kaydı başarısız:', err);
    return null;
  }
}

export async function unregisterWebPush(): Promise<void> {
  if (Platform.OS !== 'web') return;
  registered = false;
  try {
    const { apiFetch } = await import('./api');
    await apiFetch('/users/me/push-token', { method: 'DELETE' });
  } catch {
    /* ignore */
  }
}

export function getWebPushNavigationFromData(data: Record<string, string>): string | null {
  return getPushNavigationPath(parsePushData(data));
}
