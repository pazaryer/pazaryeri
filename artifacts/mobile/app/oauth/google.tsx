import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  completeGoogleRedirect,
  redirectToAppWithError,
  redirectToAppWithToken,
  saveOAuthReturnUrl,
  startGoogleRedirect,
  peekOAuthReturnUrl,
} from '@/lib/google-web-auth';
import { isMobileOAuthReturnUrl } from '@/lib/google-native-auth';

const STARTED_KEY = 'pz_google_oauth_started';

/**
 * Web Google giriş — Firebase redirect (yalnızca web tarayıcısı).
 * Mobil Expo Go bu sayfayı kullanmaz; API OAuth akışını kullanır.
 */
export default function GoogleOAuthScreen() {
  const { return: returnParam } = useLocalSearchParams<{ return?: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setError('Bu sayfa yalnızca web tarayıcısında çalışır');
      return;
    }

    // Mobil istekleri bu sayfaya yönlendirme — uygulama doğrudan Google açar
    if (
      typeof returnParam === 'string' &&
      isMobileOAuthReturnUrl(returnParam)
    ) {
      setError('Lütfen uygulamadan Google ile giriş yapın.');
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    async function run() {
      try {
        const storedReturn = peekOAuthReturnUrl();
        const appReturn = storedReturn;
        const isNativeBridge = isMobileOAuthReturnUrl(appReturn);

        const result = await completeGoogleRedirect();

        if (result?.user) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(STARTED_KEY);
          }
          const idToken = await result.user.getIdToken();
          if (isNativeBridge) {
            redirectToAppWithToken(appReturn, idToken);
            return;
          }
          router.replace('/');
          return;
        }

        if (cancelled) return;

        // Döngüyü önle: daha önce redirect başlatıldıysa tekrar başlatma
        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STARTED_KEY)) {
          setError('Google girişi tamamlanamadı. Lütfen tekrar deneyin.');
          sessionStorage.removeItem(STARTED_KEY);
          return;
        }

        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(STARTED_KEY, '1');
        }
        await startGoogleRedirect();
      } catch (e: any) {
        if (cancelled) return;
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(STARTED_KEY);
        }
        setError(e?.message ?? 'Google girişi başarısız');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [returnParam, router]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.title}>Giriş Hatası</Text>
          <Text style={styles.error}>{error}</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#C9A84C" />
          <Text style={styles.text}>Google hesabınıza yönlendiriliyorsunuz...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A0A2E',
    padding: 24,
    gap: 16,
  },
  title: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  text: { color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center' },
  error: { color: '#FF8A8A', textAlign: 'center', lineHeight: 22 },
});
