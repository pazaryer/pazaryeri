export type AdminToastPayload = {
  id: string;
  type: string;
  title: string;
  body: string;
  subtitle?: string;
  listingId?: string;
  userId?: string;
  reportId?: string;
};

type Listener = (payload: AdminToastPayload) => void;
const listeners = new Set<Listener>();

export function showAdminToast(payload: AdminToastPayload): void {
  listeners.forEach((cb) => cb(payload));
}

export function onAdminToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
