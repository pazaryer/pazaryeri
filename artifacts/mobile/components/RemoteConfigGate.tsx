import { useEffect, useState } from 'react';
import { Linking, Platform, View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { fetchRemoteConfig, isMaintenanceMode } from '@/lib/remote-config';
import { getForceUpdateState } from '@/lib/app-version';
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
  const [forceUpdate, setForceUpdate] = useState({ required: false, message: '', storeUrl: '' });
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
        setForceUpdate(getForceUpdateState());
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

  if (Platform.OS !== 'web' && forceUpdate.required) {
    return (
      <View style={[styles.center, { backgroundColor: brand.background }]}>
        <Text style={[styles.title, { color: brand.primary }]}>Güncelleme Gerekli</Text>
        <Text style={[styles.msg, { color: brand.textMuted }]}>{forceUpdate.message}</Text>
        <Pressable
          style={[styles.updateBtn, { backgroundColor: brand.primary }]}
          onPress={() => void Linking.openURL(forceUpdate.storeUrl)}
        >
          <Text style={styles.updateBtnText}>Play Store&apos;dan Güncelle</Text>
        </Pressable>
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
  updateBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  updateBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
