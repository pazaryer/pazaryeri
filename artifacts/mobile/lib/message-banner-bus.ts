export type MessageBannerPayload = {
  conversationId: string;
  listingId: string;
  senderName: string;
  listingTitle: string;
  messageText: string;
  senderAvatar?: string;
  listingImage?: string;
};

type Listener = (payload: MessageBannerPayload) => void;
const listeners = new Set<Listener>();

let activeConversationId: string | null = null;

export function setActiveConversationId(id: string | null): void {
  activeConversationId = id;
}

export function getActiveConversationId(): string | null {
  return activeConversationId;
}

export function showMessageBanner(payload: MessageBannerPayload): void {
  if (payload.conversationId === activeConversationId) return;
  listeners.forEach((cb) => cb(payload));
}

export function onMessageBanner(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
