import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations, useNotifications } from '@/lib/hooks';
import {
  onMessageBanner,
  showMessageBanner,
  type MessageBannerPayload,
} from '@/lib/message-banner-bus';
import { onInAppToast, showInAppToast, type InAppToastPayload } from '@/lib/in-app-toast-bus';
import { inAppNotificationKey, shouldShowInAppNotification } from '@/lib/notification-dedup';
import { MessageInAppBanner } from '@/components/MessageInAppBanner';
import { InAppNotificationToast } from '@/components/InAppNotificationToast';

/** Uygulama açıkken mesaj popup + diğer bildirim toastları */
export function AppNotificationWatcher() {
  const { user } = useAuth();
  const { data: convoData } = useConversations(!!user);
  const { data: notifData } = useNotifications(!!user);
  const [messageBanner, setMessageBanner] = useState<MessageBannerPayload | null>(null);
  const [toast, setToast] = useState<InAppToastPayload | null>(null);
  const lastMessageAtRef = useRef<Map<string, string>>(new Map());
  const convoInitRef = useRef(false);
  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const notifInitRef = useRef(false);

  useEffect(() => onMessageBanner((payload) => setMessageBanner(payload)), []);

  useEffect(() => onInAppToast((payload) => setToast(payload)), []);

  useEffect(() => {
    if (!user || !convoData?.items) return;

    if (!convoInitRef.current) {
      for (const convo of convoData.items) {
        lastMessageAtRef.current.set(convo.id, convo.lastMessageAt ?? '');
      }
      convoInitRef.current = true;
      return;
    }

    for (const convo of convoData.items) {
      const prev = lastMessageAtRef.current.get(convo.id) ?? '';
      const current = convo.lastMessageAt ?? '';
      if (current && current !== prev && convo.unreadCount > 0) {
        const key = inAppNotificationKey('message', { conversationId: convo.id });
        if (!shouldShowInAppNotification(key)) continue;
        showMessageBanner({
          conversationId: convo.id,
          listingId: convo.listingId,
          senderName: convo.otherUser.name,
          listingTitle: convo.listingTitle,
          messageText: convo.lastMessage ?? 'Yeni mesaj',
          senderAvatar: convo.otherUser.avatar ?? undefined,
          listingImage: convo.listingImage ?? undefined,
        });
      }
      lastMessageAtRef.current.set(convo.id, current);
    }
  }, [convoData?.items, user]);

  useEffect(() => {
    if (!user || !notifData?.items) return;

    if (!notifInitRef.current) {
      for (const n of notifData.items) seenNotifIdsRef.current.add(n.id);
      notifInitRef.current = true;
      return;
    }

    for (const n of notifData.items) {
      if (seenNotifIdsRef.current.has(n.id) || n.isRead) continue;
      seenNotifIdsRef.current.add(n.id);
      if (n.type === 'message') continue;

      const key = inAppNotificationKey(n.type, { id: n.id });
      if (!shouldShowInAppNotification(key)) continue;

      let listingId: string | undefined;
      try {
        const parsed = JSON.parse(n.data ?? '{}') as { listingId?: string };
        listingId = parsed.listingId;
      } catch {
        listingId = undefined;
      }

      showInAppToast({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        listingId,
      });
    }
  }, [notifData?.items, user]);

  return (
    <>
      <MessageInAppBanner payload={messageBanner} onDismiss={() => setMessageBanner(null)} />
      <InAppNotificationToast payload={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
