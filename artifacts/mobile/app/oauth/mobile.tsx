import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  completeGoogleRedirect,
  redirectToAppWithError,
  redirectToAppWithToken,
  saveOAuthReturnUrl,
  startGoogleRedirect,
} from '@/lib/google-web-auth';
import { isMobileOAuthReturnUrl } from '@/lib/google-native-auth';

const STARTED_KEY = 'pz_mobile_oauth_started';

/** Mobil köprü — Firebase Google redirect (GIS / origin yok) */
export default function MobileOAuthBridge() {
  const { return: returnParam } = useLocalSearchParams<{ return?: string }>();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const appReturn =
    typeof returnParam === 'string' && isMobileOAuthReturnUrl(returnParam)
      ? returnParam
      : 'pazaryeri://auth';

  const finishWithToken = useCallback(
    async (idToken: string) => {
      try {
        redirectToAppWithToken(appReturn, idToken);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Google girişi başarısız';
        setError(msg);
        redirectToAppWithError(appReturn, msg);
      }
    },
    [appReturn],
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || startedRef.current) return;
    startedRef.current = true;

    saveOAuthReturnUrl(appReturn);
    let cancelled = false;

    async function run() {
      try {
        const result = await completeGoogleRedirect();
        if (cancelled) return;

        if (result?.user) {
          sessionStorage.removeItem(STARTED_KEY);
          const idToken = await result.user.getIdToken();
          await finishWithToken(idToken);
          return;
        }

        if (sessionStorage.getItem(STARTED_KEY)) {
          setError('Google girişi tamamlanamadı. Lütfen tekrar deneyin.');
          sessionStorage.removeItem(STARTED_KEY);
          return;
        }

        sessionStorage.setItem(STARTED_KEY, '1');
        await startGoogleRedirect(appReturn);
      } catch (e: unknown) {
        if (cancelled) return;
        sessionStorage.removeItem(STARTED_KEY);
        setError(e instanceof Error ? e.message : 'Google girişi başarısız');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [appReturn, finishWithToken]);

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
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            <ActivityIndicator size="large" color="#3D1A78" style={{ marginVertical: 16 }} />
            <Text style={styles.subtitle}>Google hesabınıza yönlendiriliyorsunuz...</Text>
          </>
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
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  errorOnly: { color: '#FFF', textAlign: 'center' },
});
