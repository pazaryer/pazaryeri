import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminNotifications } from '@/lib/hooks';
import { onAdminToast, showAdminToast, type AdminToastPayload } from '@/lib/admin-toast-bus';
import { inAppNotificationKey, shouldShowInAppNotification } from '@/lib/notification-dedup';
import { parseNotificationData } from '@/lib/notifications';
import { AdminNotificationToast } from '@/components/AdminNotificationToast';

const ADMIN_TYPES = new Set(['admin_new_listing', 'admin_new_user', 'admin_new_report']);

/** Uygulama açıkken admin bildirimleri — ses + detaylı toast */
export function AdminNotificationWatcher() {
  const { profile } = useAuth();
  const { data } = useAdminNotifications(!!profile);
  const [toast, setToast] = useState<AdminToastPayload | null>(null);
  const seenIdsRef = useRef(new Set<string>());
  const initRef = useRef(false);

  useEffect(() => onAdminToast((payload) => setToast(payload)), []);

  useEffect(() => {
    if (!profile || !data?.items) return;

    if (!initRef.current) {
      for (const n of data.items) seenIdsRef.current.add(n.id);
      initRef.current = true;
      return;
    }

    for (const n of data.items) {
      if (!ADMIN_TYPES.has(n.type)) continue;
      if (seenIdsRef.current.has(n.id) || n.isRead) continue;
      seenIdsRef.current.add(n.id);

      const key = inAppNotificationKey(n.type, { id: n.id });
      if (!shouldShowInAppNotification(key)) continue;

      const meta = parseNotificationData(n.data);
      showAdminToast({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        listingId: meta.listingId,
        userId: meta.userId,
        reportId: meta.reportId,
      });
    }
  }, [data?.items, profile]);

  return <AdminNotificationToast payload={toast} onDismiss={() => setToast(null)} />;
}
