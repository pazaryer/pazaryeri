import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signInWithGoogleMobile } from '@/lib/google-native-auth';

export default function LoginScreen() {
  if (Platform.OS === 'web') {
    return <Redirect href="/giris" />;
  }
  return <MobileLoginScreen />;
}

function MobileLoginScreen() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogleMobile();
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Google ile giriş başarısız';
      if (msg.includes('iptal') || msg.includes('cancel')) return;
      Alert.alert('Giriş Hatası', msg);
    } finally {
      setGoogleLoading(false);
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
            style={[styles.optionButton, styles.googleButton, googleLoading && styles.disabled]}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#3D1A78" />
            ) : (
              <>
                <Ionicons name="logo-google" size={22} color="#EA4335" />
                <Text style={styles.googleText}>Google ile Giriş Yap</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.optionButton}
            onPress={() => router.push('/email-auth')}
          >
            <Ionicons name="mail-outline" size={22} color="#3D1A78" />
            <Text style={styles.optionText}>E-posta ile Giriş Yap</Text>
          </Pressable>

          <Pressable
            style={[styles.optionButton, styles.registerButton]}
            onPress={() => router.push('/email-auth?mode=register')}
          >
            <Ionicons name="person-add-outline" size={22} color="#FFFFFF" />
            <Text style={styles.registerText}>Kayıt Ol</Text>
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
    padding: 28,
    paddingTop: 100,
    paddingBottom: 48,
  },
  logoContainer: { alignItems: 'center', gap: 14 },
  appIcon: {
    width: 96,
    height: 96,
    borderRadius: 22,
    elevation: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  actions: { gap: 12 },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 10,
    backgroundColor: '#FFFFFF',
    minHeight: 54,
  },
  googleButton: {},
  registerButton: {
    backgroundColor: '#C9A84C',
    marginTop: 4,
  },
  disabled: { opacity: 0.7 },
  googleText: { fontSize: 16, fontWeight: '600', color: '#1A0A2E' },
  optionText: { fontSize: 16, fontWeight: '600', color: '#1A0A2E' },
  registerText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  legal: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  legalLink: {
    color: '#C9A84C',
    textDecorationLine: 'underline',
  },
});
