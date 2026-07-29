import { useEffect } from 'react';
import { pingPresence } from './marquee';

/** Tüm kullanıcılar için cihaz bazlı presence ping (giriş şart değil) */
export function usePresencePing(intervalMs = 45_000) {
  useEffect(() => {
    pingPresence();
    const t = setInterval(pingPresence, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
}
