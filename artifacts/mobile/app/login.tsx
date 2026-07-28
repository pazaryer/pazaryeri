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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithGoogleMobile } from '@/lib/google-native-auth';

export default function LoginScreen() {
  if (Platform.OS === 'web') {
    return <Redirect href="/giris" />;
  }
  return <MobileLoginScreen />;
}

function MobileLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.hero}>
        <Image source={require('@/assets/images/icon.png')} style={styles.appIcon} />
        <Text style={styles.title}>Pazaryeri</Text>
        <Text style={styles.tagline}>Satmak bu kadar kolay</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.googleBtn, googleLoading && styles.disabled]}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color="#2C2C2C" />
          ) : (
            <>
              <Ionicons name="logo-google" size={22} color="#EA4335" />
              <Text style={styles.btnTextDark}>Google ile devam et</Text>
            </>
          )}
        </Pressable>

        <Pressable style={styles.btn} onPress={() => router.push('/email-auth')}>
          <Ionicons name="mail-outline" size={22} color="#2C2C2C" />
          <Text style={styles.btnTextDark}>E-posta ile devam et</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, styles.primaryBtn]}
          onPress={() => router.push('/email-auth?mode=register')}
        >
          <Ionicons name="person-add-outline" size={22} color="#FFF" />
          <Text style={styles.btnTextLight}>Hesap oluştur</Text>
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
          'nı kabul edersiniz.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  hero: { alignItems: 'center', gap: 10, marginTop: 40 },
  appIcon: { width: 88, height: 88, borderRadius: 20 },
  title: { fontSize: 34, fontWeight: '900', color: '#FF3B30', letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: '#717171', fontWeight: '500' },
  actions: { gap: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 28,
    gap: 10,
    backgroundColor: '#F4F4F4',
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  googleBtn: { backgroundColor: '#FFFFFF' },
  primaryBtn: { backgroundColor: '#FF3B30', borderColor: '#FF3B30', marginTop: 4 },
  disabled: { opacity: 0.7 },
  btnTextDark: { fontSize: 16, fontWeight: '600', color: '#2C2C2C' },
  btnTextLight: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  legal: { color: '#9E9E9E', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 8 },
  legalLink: { color: '#FF3B30', fontWeight: '600' },
});
