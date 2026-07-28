import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BRAND } from '@/constants/brand';
import { redirectToAppWithError, redirectToAppWithToken } from '@/lib/google-web-auth';

type BridgeParams = {
  id_token?: string | string[];
  error?: string | string[];
  native?: string | string[];
};

/**
 * Google OAuth HTTPS dönüş köprüsü (Android Custom Tab).
 * Token'ı native deep link ile uygulamaya iletir.
 */
export default function OAuthAppReturnScreen() {
  const params = useLocalSearchParams<BridgeParams>();
  const [manual, setManual] = useState(false);
  const redirected = useRef(false);

  const idToken = pickParam(params.id_token) ?? readWebParam('id_token');
  const error = pickParam(params.error) ?? readWebParam('error');
  const native = pickParam(params.native) ?? readWebParam('native');

  useEffect(() => {
    if (Platform.OS !== 'web' || redirected.current) return;
    if (!native) return;

    redirected.current = true;

    if (error) {
      redirectToAppWithError(native, error);
      window.setTimeout(() => setManual(true), 2500);
      return;
    }

    if (idToken) {
      redirectToAppWithToken(native, idToken);
      window.setTimeout(() => setManual(true), 2500);
    }
  }, [idToken, error, native]);

  const retryOpenApp = () => {
    if (!native) return;
    if (error) {
      redirectToAppWithError(native, error);
      return;
    }
    if (idToken) {
      redirectToAppWithToken(native, idToken);
    }
  };

  return (
    <View style={styles.wrap}>
      {error ? (
        <>
          <Text style={styles.title}>Giriş tamamlanamadı</Text>
          <Text style={styles.sub}>{error}</Text>
          {native && manual ? (
            <Pressable style={styles.btn} onPress={retryOpenApp}>
              <Text style={styles.btnText}>Uygulamaya dön</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={BRAND.primary} />
          <Text style={styles.title}>Giriş başarılı</Text>
          <Text style={styles.sub}>Uygulamaya dönülüyor...</Text>
          {native && manual ? (
            <Pressable style={styles.btn} onPress={retryOpenApp}>
              <Text style={styles.btnText}>Uygulamaya dön</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

function pickParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function readWebParam(key: string): string | undefined {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
  return new URL(window.location.href).searchParams.get(key) ?? undefined;
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: BRAND.background,
    gap: 12,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
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
