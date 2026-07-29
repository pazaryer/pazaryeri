import { useEffect, useState } from 'react';
import { Platform, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchRemoteConfig, isMaintenanceMode } from '@/lib/remote-config';
import { applyBrandFromRemote } from '@/lib/brand-runtime';
import { BrandProvider } from '@/contexts/BrandContext';
import { BrandWebHead } from '@/components/BrandWebHead';
import { useMobilePromoRefresh } from '@/hooks/useMobilePromoRefresh';
import { AppOverlays } from '@/components/AppOverlays';
import { WebAppDownloadFab } from '@/components/web/WebAppDownloadFab';
import { useAdMobLifecycle } from '@/lib/admob/init';
import { isAdMobSupported } from '@/lib/admob/native';

export function RemoteConfigGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [maintenance, setMaintenance] = useState({ active: false, message: '' });
  const [brand, setBrand] = useState(() => applyBrandFromRemote({}));
  useMobilePromoRefresh();
  useAdMobLifecycle();

  useEffect(() => {
    let cancelled = false;

    async function loadConfig(attempt = 0) {
      try {
        const config = await fetchRemoteConfig(attempt > 0);
        if (cancelled) return;
        setBrand(applyBrandFromRemote(config));
        setMaintenance(isMaintenanceMode());
        setReady(true);
      } catch {
        if (cancelled) return;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
          return loadConfig(attempt + 1);
        }
        setReady(true);
      }
    }

    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: brand.background }]}>
        <ActivityIndicator color={brand.primary} size="large" />
      </View>
    );
  }

  if (maintenance.active) {
    return (
      <View style={[styles.center, { backgroundColor: brand.background }]}>
        <Text style={[styles.title, { color: brand.primary }]}>Bakım Modu</Text>
        <Text style={[styles.msg, { color: brand.textMuted }]}>{maintenance.message}</Text>
      </View>
    );
  }

  return (
    <BrandProvider brand={brand}>
      {Platform.OS === 'web' ? <BrandWebHead /> : null}
      {Platform.OS === 'web' ? <WebAppDownloadFab /> : null}
      {children}
      {Platform.OS !== 'web' && isAdMobSupported() ? <AppOverlays /> : null}
    </BrandProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  msg: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
