import { useEffect, useState } from 'react';
import { Platform, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchRemoteConfig, isMaintenanceMode } from '@/lib/remote-config';
import { applyBrandFromRemote } from '@/lib/brand-runtime';
import { BrandProvider } from '@/contexts/BrandContext';
import { BrandWebHead } from '@/components/BrandWebHead';

export function RemoteConfigGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [maintenance, setMaintenance] = useState({ active: false, message: '' });
  const [brand, setBrand] = useState(() => applyBrandFromRemote({}));

  useEffect(() => {
    fetchRemoteConfig()
      .then((config) => {
        setBrand(applyBrandFromRemote(config));
        setMaintenance(isMaintenanceMode());
      })
      .catch(() => {})
      .finally(() => setReady(true));
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
      {children}
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
