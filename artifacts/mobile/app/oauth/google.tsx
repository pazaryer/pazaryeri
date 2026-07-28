import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  completeGoogleRedirect,
  extractGoogleIdTokenFromRedirect,
  redirectToAppWithError,
  redirectToAppWithToken,
  signInWithGooglePopup,
  startGoogleRedirect,
  peekOAuthReturnUrl,
} from '@/lib/google-web-auth';
import { isMobileOAuthReturnUrl } from '@/lib/google-native-auth';

const STARTED_KEY = 'pz_google_oauth_started';

/**
 * Web Google giriş.
 * Mobil: ?return= ile gelir → Firebase popup (hesap seçici) → app-return?id_token
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

    if (startedRef.current) return;
    startedRef.current = true;

    const appReturn = typeof returnParam === 'string' ? returnParam : '';
    const isMobileBridge = appReturn && isMobileOAuthReturnUrl(appReturn);

    let cancelled = false;

    async function runMobileBridge() {
      try {
        const result = await signInWithGooglePopup();
        if (cancelled) return;
        const idToken = extractGoogleIdTokenFromRedirect(result);
        if (!idToken) throw new Error('Google token alınamadı');
        redirectToAppWithToken(appReturn, idToken);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Google girişi başarısız';
        const code = (e as { code?: string })?.code ?? '';
        if (code === 'auth/popup-closed-by-user' || msg.toLowerCase().includes('cancel')) {
          redirectToAppWithError(appReturn, 'Google girişi iptal edildi');
        } else {
          redirectToAppWithError(appReturn, msg);
        }
      }
    }

    async function runWebRedirect() {
      try {
        const storedReturn = peekOAuthReturnUrl();
        const isNativeBridge = isMobileOAuthReturnUrl(storedReturn);

        const result = await completeGoogleRedirect();

        if (result?.user) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(STARTED_KEY);
          }
          if (isNativeBridge) {
            const googleIdToken = extractGoogleIdTokenFromRedirect(result);
            if (!googleIdToken) throw new Error('Google token alınamadı');
            redirectToAppWithToken(storedReturn, googleIdToken);
            return;
          }
          router.replace('/');
          return;
        }

        if (cancelled) return;

        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STARTED_KEY)) {
          setError('Google girişi tamamlanamadı. Lütfen tekrar deneyin.');
          sessionStorage.removeItem(STARTED_KEY);
          return;
        }

        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(STARTED_KEY, '1');
        }
        await startGoogleRedirect();
      } catch (e: unknown) {
        if (cancelled) return;
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(STARTED_KEY);
        }
        setError(e instanceof Error ? e.message : 'Google girişi başarısız');
      }
    }

    if (isMobileBridge) {
      runMobileBridge();
    } else {
      runWebRedirect();
    }

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
          <Text style={styles.text}>Google hesap seçici açılıyor…</Text>
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
