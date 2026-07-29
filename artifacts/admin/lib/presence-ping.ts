import { useEffect } from 'react';
import Constants from 'expo-constants';
import { publicFetch } from '@/lib/api';
import { getAdminDeviceId } from '@/lib/device-id';

export function useAdminPresencePing(intervalMs = 45_000) {
  useEffect(() => {
    const ping = async () => {
      try {
        const deviceId = await getAdminDeviceId();
        await publicFetch('/presence/ping', {
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
  }, [intervalMs]);
}
