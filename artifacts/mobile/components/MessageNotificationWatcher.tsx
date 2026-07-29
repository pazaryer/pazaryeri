import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/lib/hooks';
import {
  onMessageBanner,
  showMessageBanner,
  type MessageBannerPayload,
} from '@/lib/message-banner-bus';
import { MessageInAppBanner } from '@/components/MessageInAppBanner';

/** Uygulama açıkken yeni mesaj popup + sohbet listesi izleme */
export function MessageNotificationWatcher() {
  const { user } = useAuth();
  const { data } = useConversations(!!user);
  const [banner, setBanner] = useState<MessageBannerPayload | null>(null);
  const lastMessageAtRef = useRef<Map<string, string>>(new Map());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    return onMessageBanner((payload) => setBanner(payload));
  }, []);

  useEffect(() => {
    if (!user || !data?.items) return;

    if (!initializedRef.current) {
      for (const convo of data.items) {
        lastMessageAtRef.current.set(convo.id, convo.lastMessageAt ?? '');
      }
      initializedRef.current = true;
      return;
    }

    for (const convo of data.items) {
      const prev = lastMessageAtRef.current.get(convo.id) ?? '';
      const current = convo.lastMessageAt ?? '';
      if (current && current !== prev && convo.unreadCount > 0) {
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
  }, [data?.items, user]);

  if (Platform.OS === 'web') return null;

  return <MessageInAppBanner payload={banner} onDismiss={() => setBanner(null)} />;
}
