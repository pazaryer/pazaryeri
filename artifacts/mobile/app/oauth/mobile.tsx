import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/components/AppIcon';
import { sitePath } from '@/lib/config';
import { isMobileOAuthReturnUrl } from '@/lib/google-native-auth';

/**
 * Mobil OAuth köprüsü — Firebase redirect KULLANMAZ (sessionStorage hatası önlenir).
 * Doğrudan Render API OAuth akışına yönlendirir.
 */
export default function MobileOAuthBridge() {
  const { return: returnParam } = useLocalSearchParams<{ return?: string }>();

  const appReturn =
    typeof returnParam === 'string' && isMobileOAuthReturnUrl(returnParam)
      ? returnParam
      : 'pazaryeri://auth';

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const startUrl = `${sitePath('/oauth/start')}?return=${encodeURIComponent(appReturn)}`;
    window.location.replace(startUrl);
  }, [appReturn]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorOnly}>Bu sayfa yalnızca web tarayıcısında çalışır</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#3D1A78', '#1A0A2E']} style={StyleSheet.absoluteFill} />
      <View style={styles.card}>
        <AppIcon size="lg" variant="splash" />
        <Text style={styles.title}>Pazaryeri</Text>
        <ActivityIndicator size="large" color="#3D1A78" style={{ marginVertical: 16 }} />
        <Text style={styles.subtitle}>Google hesabınıza yönlendiriliyorsunuz...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: '100vh' as unknown as number,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 14,
  },
  icon: { width: 64, height: 64, borderRadius: 14 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A0A2E' },
  subtitle: { fontSize: 14, color: '#7A6B8A', textAlign: 'center' },
  errorOnly: { color: '#FFF', textAlign: 'center' },
});
