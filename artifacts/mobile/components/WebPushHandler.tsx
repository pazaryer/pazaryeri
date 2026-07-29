import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { registerWebPush } from '@/lib/web-push';

/** Web tarayıcı push bildirim kaydı */
export function WebPushHandler() {
  const { user } = useAuth();

  useEffect(() => {
    if (Platform.OS !== 'web' || !user) return;
    const timer = setTimeout(() => {
      void registerWebPush();
    }, 2000);
    return () => clearTimeout(timer);
  }, [user]);

  return null;
}
