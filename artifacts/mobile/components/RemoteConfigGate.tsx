import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchRemoteConfig, isMaintenanceMode } from '@/lib/remote-config';
import { BRAND } from '@/constants/brand';

export function RemoteConfigGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [maintenance, setMaintenance] = useState({ active: false, message: '' });

  useEffect(() => {
    fetchRemoteConfig()
      .then(() => setMaintenance(isMaintenanceMode()))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={BRAND.primary} size="large" />
      </View>
    );
  }

  if (maintenance.active) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Bakım Modu</Text>
        <Text style={styles.msg}>{maintenance.message}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND.background,
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: '700', color: BRAND.primary, marginBottom: 12 },
  msg: { fontSize: 15, color: BRAND.textMuted, textAlign: 'center', lineHeight: 22 },
});
