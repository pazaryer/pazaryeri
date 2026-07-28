import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { BRAND } from '@/constants/brand';
import { completeGoogleSignInFromUrl } from '@/lib/google-native-auth';

WebBrowser.maybeCompleteAuthSession();

/**
 * OAuth deep link hedefi: pazaryeri://auth?id_token=... veya exp://.../--/auth?id_token=...
 * HTTPS köprü sayfasından uygulamaya dönüşte token burada işlenir.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id_token?: string | string[]; error?: string | string[] }>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const idToken = pickParam(params.id_token);
    const err = pickParam(params.error);

    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    if (!idToken) {
      setError('Google oturum bilgisi bulunamadı');
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        await completeGoogleSignInFromUrl(`?id_token=${encodeURIComponent(idToken)}`);
        router.replace('/(tabs)');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Google girişi başarısız');
        setLoading(false);
      }
    })();
  }, [params.id_token, params.error, router]);

  return (
    <View style={styles.wrap}>
      {loading && !error ? (
        <>
          <ActivityIndicator size="large" color={BRAND.primary} />
          <Text style={styles.title}>Giriş tamamlanıyor...</Text>
        </>
      ) : null}
      {error ? (
        <>
          <Text style={styles.title}>Giriş tamamlanamadı</Text>
          <Text style={styles.sub}>{error}</Text>
          <Pressable style={styles.btn} onPress={() => router.replace('/login')}>
            <Text style={styles.btnText}>Giriş ekranına dön</Text>
          </Pressable>
        </>
      ) : null}
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
    padding: 24,
    backgroundColor: BRAND.background,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: BRAND.text, textAlign: 'center' },
  sub: { fontSize: 14, color: BRAND.textMuted, textAlign: 'center', lineHeight: 20 },
  btn: {
    marginTop: 16,
    backgroundColor: BRAND.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
