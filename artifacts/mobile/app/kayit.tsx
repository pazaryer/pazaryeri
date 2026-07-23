import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { WebShell } from '@/components/web/WebShell';

export default function KayitScreen() {
  const router = useRouter();
  const { signInWithGooglePopup, user, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  const handleGoogleSignup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGooglePopup();
      router.replace('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Google ile kayıt başarısız';
      if (!msg.includes('popup-closed') && !msg.includes('cancel')) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [signInWithGooglePopup, router]);

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
    <WebShell hideFooter>
      <View style={styles.page}>
        <View style={styles.card}>
          <LinearGradient colors={['#3D1A78', '#1A0A2E']} style={styles.cardHeader}>
            <Image source={require('@/assets/images/icon.png')} style={styles.icon} />
            <Text style={styles.cardTitle}>Kayıt Ol</Text>
            <Text style={styles.cardSubtitle}>Ücretsiz hesap oluşturun</Text>
          </LinearGradient>

          <View style={styles.cardBody}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#3D1A78" />
                <Text style={styles.loadingText}>Hesap oluşturuluyor...</Text>
              </View>
            ) : (
              <Pressable
                style={styles.googleBtn}
                onPress={handleGoogleSignup}
                disabled={loading}
              >
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleBtnText}>Google ile Devam Et</Text>
              </Pressable>
            )}

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
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
  loadingBox: { alignItems: 'center', gap: 10, padding: 16 },
  loadingText: { color: '#7A6B8A', fontSize: 14 },
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
  cardHeader: { padding: 24, alignItems: 'center', gap: 8 },
  icon: { width: 56, height: 56, borderRadius: 12 },
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
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DADCE0',
    backgroundColor: '#FFFFFF',
  },
  googleIcon: { fontSize: 18, fontWeight: '800', color: '#EA4335' },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: '#1A0A2E' },
  fallbackBtn: { alignItems: 'center', paddingVertical: 4 },
  fallbackText: { color: '#7A6B8A', fontSize: 12, textDecorationLine: 'underline' },
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
