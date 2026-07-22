import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogleViaApi } from '@/lib/google-auth';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogleIdToken, signInWithGoogleWeb } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        await signInWithGoogleWeb();
        return;
      }

      const idToken = await signInWithGoogleViaApi();
      await signInWithGoogleIdToken(idToken);
    } catch (e: any) {
      Alert.alert('Giriş Hatası', e.message ?? 'Google ile giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3D1A78', '#1A0A2E']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Logo size={64} color="#C9A84C" />
          </View>
          <Text style={styles.title}>Pazaryeri</Text>
          <Text style={styles.tagline}>Satmak bu kadar kolay</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.googleButton, loading && styles.disabled]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#3D1A78" />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color="#EA4335" />
                <Text style={styles.googleText}>Google ile Giriş Yap</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.phoneLink}
            onPress={() => router.push('/email-auth')}
          >
            <Text style={styles.phoneLinkText}>E-posta ile Devam Et</Text>
          </Pressable>

          <Text style={styles.legal}>
            Devam ederek{' '}
            <Text style={styles.legalLink} onPress={() => router.push('/terms')}>
              Kullanım Şartları
            </Text>
            {' '}ve{' '}
            <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>
              Gizlilik Politikası
            </Text>
            'nı kabul etmiş olursunuz.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 32,
    paddingTop: 120,
    paddingBottom: 60,
  },
  logoContainer: { alignItems: 'center', gap: 16 },
  logoCircle: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  actions: { gap: 24 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 56,
  },
  disabled: { opacity: 0.7 },
  googleText: { fontSize: 16, fontWeight: '600', color: '#000000' },
  phoneLink: { alignItems: 'center' },
  phoneLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legal: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: '#C9A84C',
    textDecorationLine: 'underline',
  },
});
