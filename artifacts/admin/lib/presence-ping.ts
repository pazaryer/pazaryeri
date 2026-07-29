import { useEffect } from 'react';
import Constants from 'expo-constants';
import { authFetch, getIdToken } from '@/lib/api';
import { getAdminDeviceId } from '@/lib/device-id';
import { useAuth } from '@/contexts/AuthContext';

export function useAdminPresencePing(intervalMs = 45_000) {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || !profile) return;

    const ping = async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const deviceId = await getAdminDeviceId();
        await authFetch('/presence/ping', {
          method: 'POST',
          body: JSON.stringify({
            deviceId,
            platform: 'admin',
            appVersion: Constants.expoConfig?.version ?? '1.0.0',
          }),
        });
      } catch {
        /* ignore */
      }
    };
    void ping();
    const t = setInterval(ping, intervalMs);
    return () => clearInterval(t);
  }, [user, profile, intervalMs]);
}
