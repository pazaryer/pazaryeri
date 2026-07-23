import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { promptGoogleSignIn } from '@/lib/google-native-auth';

export default function LoginScreen() {
  if (Platform.OS === 'web') {
    return <Redirect href="/giris" />;
  }
  return <MobileLoginScreen />;
}

function MobileLoginScreen() {
  const router = useRouter();
  const { signInWithGoogleIdToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const idToken = await promptGoogleSignIn();
      await signInWithGoogleIdToken(idToken);
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('iptal') || msg.includes('cancel')) return;
      Alert.alert('Giriş Hatası', msg || 'Google ile giriş başarısız');
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
          <Image source={require('@/assets/images/icon.png')} style={styles.appIcon} />
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

          <Pressable style={styles.phoneLink} onPress={() => router.push('/email-auth')}>
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
  appIcon: {
    width: 96,
    height: 96,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
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
