import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { WebShell } from '@/components/web/WebShell';
import { WebGoogleLoginButton } from '@/components/web/WebGoogleLoginButton';
import { AppIcon } from '@/components/AppIcon';
import { SeoHead } from '@/components/SeoHead';

export default function KayitScreen() {
  const router = useRouter();
  const { signInWithGoogleIdToken, user, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setLoading(true);
      setError(null);
      try {
        await signInWithGoogleIdToken(idToken);
        router.replace('/');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Google ile kayıt başarısız';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [signInWithGoogleIdToken, router],
  );

  const handleGoogleError = useCallback((msg: string) => {
    if (!msg.includes('iptal') && !msg.includes('cancel')) {
      setError(msg);
    }
  }, []);

  if (Platform.OS !== 'web') {
    return <Redirect href="/login" />;
  }

  if (isLoading) {
    return (
      <WebShell hideFooter>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3D1A78" />
        </View>
      </WebShell>
    );
  }

  return (
    <>
      <SeoHead
        title="Ücretsiz Kayıt Ol"
        description="Pazaryeri'ne ücretsiz kayıt olun, ikinci el ilan verin ve alım satım yapın."
        path="/kayit"
      />
      <WebShell hideFooter>
      <View style={styles.page}>
        <View style={styles.card}>
          <LinearGradient colors={['#3D1A78', '#1A0A2E']} style={styles.cardHeader}>
            <AppIcon size="md" />
            <Text style={styles.cardTitle}>Kayıt Ol</Text>
            <Text style={styles.cardSubtitle}>Ücretsiz hesap oluşturun</Text>
          </LinearGradient>

          <View style={styles.cardBody}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <WebGoogleLoginButton
              loading={loading}
              onCredential={handleGoogleCredential}
              onError={handleGoogleError}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={styles.emailBtn} onPress={() => router.push('/kayit/eposta')}>
              <Text style={styles.emailBtnText}>E-posta ile Kayıt Ol</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/giris')}>
              <Text style={styles.switchLink}>
                Zaten hesabın var mı? <Text style={styles.switchBold}>Giriş yap</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </WebShell>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
  page: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 460,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E0F4',
  },
  cardHeader: { padding: 24, alignItems: 'center', gap: 10 },
  cardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  cardSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  cardBody: { padding: 22, gap: 12 },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { color: '#B91C1C', fontSize: 12, fontWeight: '600', lineHeight: 17 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8E0F4' },
  dividerText: { color: '#9D8BB5', fontSize: 12 },
  emailBtn: {
    alignItems: 'center',
    padding: 13,
    borderRadius: 10,
    backgroundColor: '#F4F1FA',
    borderWidth: 1,
    borderColor: '#E8E0F4',
  },
  emailBtnText: { fontSize: 14, fontWeight: '700', color: '#3D1A78' },
  switchLink: { color: '#7A6B8A', textAlign: 'center', fontSize: 13 },
  switchBold: { color: '#3D1A78', fontWeight: '700' },
});
