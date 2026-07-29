export type InAppToastPayload = {
  id: string;
  type: string;
  title: string;
  body: string;
  listingId?: string;
  subtitle?: string;
};

type Listener = (payload: InAppToastPayload) => void;
const listeners = new Set<Listener>();

export function showInAppToast(payload: InAppToastPayload): void {
  listeners.forEach((cb) => cb(payload));
}

export function onInAppToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
