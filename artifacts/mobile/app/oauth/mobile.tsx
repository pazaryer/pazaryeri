import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleSignInButton } from '@/components/web/GoogleSignInButton';
import { redirectToAppWithError, redirectToAppWithToken } from '@/lib/google-web-auth';
import { isMobileOAuthReturnUrl } from '@/lib/google-native-auth';

/** Mobil uygulama Google giriş — Firebase uyumlu GIS (web /giris ile aynı) */
export default function MobileOAuthBridge() {
  const { return: returnParam } = useLocalSearchParams<{ return?: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appReturn =
    typeof returnParam === 'string' && isMobileOAuthReturnUrl(returnParam)
      ? returnParam
      : 'pazaryeri://auth';

  const handleCredential = useCallback(
    (idToken: string) => {
      setLoading(true);
      setError(null);
      try {
        redirectToAppWithToken(appReturn, idToken);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Google girişi başarısız';
        setError(msg);
        redirectToAppWithError(appReturn, msg);
      } finally {
        setLoading(false);
      }
    },
    [appReturn],
  );

  const handleGoogleError = useCallback((e: Error) => {
    setError(e.message);
  }, []);

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
        <Image source={require('@/assets/images/icon.png')} style={styles.icon} />
        <Text style={styles.title}>Pazaryeri</Text>
        <Text style={styles.subtitle}>Google hesabınızla giriş yapın</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#3D1A78" style={{ marginVertical: 20 }} />
        ) : (
          <GoogleSignInButton
            buttonId="pazaryeri-google-mobile-oauth"
            onCredential={handleCredential}
            onError={handleGoogleError}
          />
        )}
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
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { color: '#B91C1C', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  errorOnly: { color: '#FFF', textAlign: 'center' },
});
