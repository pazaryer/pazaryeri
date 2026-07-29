import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BRAND } from '@/constants/brand';
import { completeGoogleSignInFromUrl } from '@/lib/google-native-auth';
import { getFirebaseAuth } from '@/lib/firebase';

/** OAuth dönüşü: exp://.../auth?id_token=... — giriş tamamlanınca ana sayfaya */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id_token?: string | string[]; error?: string | string[] }>();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const auth = getFirebaseAuth();

    const goHome = () => router.replace('/(tabs)');

    if (auth.currentUser) {
      goHome();
      return;
    }

    const idToken = pickParam(params.id_token);
    const err = pickParam(params.error);

    if (err) {
      router.replace('/login');
      return;
    }

    if (idToken) {
      void (async () => {
        try {
          await completeGoogleSignInFromUrl(`?id_token=${encodeURIComponent(idToken)}`);
        } catch {
          /* runGoogleOAuth zaten tamamlamış olabilir */
        }
        goHome();
      })();
      return;
    }

    const timer = setTimeout(() => {
      if (auth.currentUser) goHome();
      else router.replace('/login');
    }, 8000);

    const unsub = auth.onAuthStateChanged((u) => {
      if (u) {
        clearTimeout(timer);
        unsub();
        goHome();
      }
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [params.id_token, params.error, router]);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={BRAND.primary} />
    </View>
  );
}

function pickParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.background,
  },
});
