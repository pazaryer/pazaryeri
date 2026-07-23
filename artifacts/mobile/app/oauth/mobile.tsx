import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  Pressable,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { redirectToAppWithError, redirectToAppWithToken } from '@/lib/google-web-auth';
import { isMobileOAuthReturnUrl } from '@/lib/google-native-auth';
import {
  getMobileOAuthReturn,
  parseOAuthHash,
  saveMobileOAuthReturn,
  startMobileGoogleOAuth,
} from '@/lib/google-oauth-bridge';

/**
 * Mobil Google giriş — OAuth2 id_token (redirect_uri: pazaryeri0.web.app/oauth/mobile).
 * GIS yerine açık OAuth kullanılır (in-app tarayıcıda redirect_uri_mismatch önlenir).
 */
export default function MobileOAuthBridge() {
  const { return: returnParam } = useLocalSearchParams<{ return?: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appReturn =
    typeof returnParam === 'string' && isMobileOAuthReturnUrl(returnParam)
      ? returnParam
      : 'pazaryeri://auth';

  const finishWithToken = useCallback(
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

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    saveMobileOAuthReturn(appReturn);

    const { idToken, error: oauthError } = parseOAuthHash();
    if (oauthError) {
      setError(oauthError);
      return;
    }
    if (idToken) {
      finishWithToken(idToken);
    }
  }, [appReturn, finishWithToken]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorOnly}>Bu sayfa yalnızca web tarayıcısında çalışır</Text>
      </View>
    );
  }

  const handleGooglePress = () => {
    setError(null);
    saveMobileOAuthReturn(getMobileOAuthReturn() || appReturn);
    startMobileGoogleOAuth();
  };

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
          <Pressable style={styles.googleBtn} onPress={handleGooglePress}>
            <Text style={styles.googleBtnText}>Google ile Devam Et</Text>
          </Pressable>
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
  googleBtn: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  googleBtnText: { fontSize: 16, fontWeight: '700', color: '#1A0A2E' },
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
