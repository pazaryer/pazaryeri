import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { WebShell } from '@/components/web/WebShell';

type Mode = 'login' | 'register' | 'forgot';

interface EmailAuthFormProps {
  mode: 'login' | 'register';
}

export function EmailAuthForm({ mode }: EmailAuthFormProps) {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [subMode, setSubMode] = useState<Mode>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titles: Record<Mode, string> = {
    login: 'E-posta ile Giriş',
    register: 'Hesap Oluştur',
    forgot: 'Şifre Sıfırla',
  };

  const handleSubmit = async () => {
    setError(null);
    if (!email.includes('@')) {
      setError('Geçerli bir e-posta adresi girin');
      return;
    }

    if (subMode === 'login' && password.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }

    if (subMode === 'register') {
      if (name.trim().length < 2) {
        setError('Adınızı girin');
        return;
      }
      if (password.length < 6) {
        setError('Şifre en az 6 karakter olmalı');
        return;
      }
    }

    setLoading(true);
    try {
      if (subMode === 'login') {
        await signInWithEmail(email, password);
        router.replace('/');
      } else if (subMode === 'register') {
        await signUpWithEmail(email, password, name);
        router.replace('/');
      } else {
        await resetPassword(email);
        setError(null);
        setSubMode('login');
        setError('Şifre sıfırlama bağlantısı e-postanıza gönderildi');
      }
    } catch (e: any) {
      setError(firebaseAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  const backHref = subMode === 'register' || mode === 'register' ? '/kayit' : '/giris';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.push(backHref)}>
          <Text style={styles.backBtn}>← Geri</Text>
        </Pressable>
        <Text style={styles.title}>{titles[subMode]}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {error && (
          <View style={[styles.messageBox, error.includes('gönderildi') && styles.successBox]}>
            <Text style={[styles.messageText, error.includes('gönderildi') && styles.successText]}>
              {error}
            </Text>
          </View>
        )}

        {subMode === 'register' && (
          <>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              placeholder="Adınız"
              placeholderTextColor="#9D8BB5"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </>
        )}

        <Text style={styles.label}>E-posta</Text>
        <TextInput
          style={styles.input}
          placeholder="ornek@email.com"
          placeholderTextColor="#9D8BB5"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {subMode !== 'forgot' && (
          <>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="En az 6 karakter"
              placeholderTextColor="#9D8BB5"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </>
        )}

        <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>
              {subMode === 'login' ? 'Giriş Yap' : subMode === 'register' ? 'Kayıt Ol' : 'Sıfırlama Gönder'}
            </Text>
          )}
        </Pressable>

        {subMode === 'login' && (
          <>
            <Pressable onPress={() => setSubMode('forgot')}>
              <Text style={styles.linkPrimary}>Şifremi unuttum</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/kayit')}>
              <Text style={styles.linkMuted}>
                Hesabın yok mu? <Text style={styles.linkBold}>Kayıt ol</Text>
              </Text>
            </Pressable>
          </>
        )}

        {subMode === 'register' && (
          <Pressable onPress={() => router.push('/giris')}>
            <Text style={styles.linkMuted}>
              Zaten hesabın var mı? <Text style={styles.linkBold}>Giriş yap</Text>
            </Text>
          </Pressable>
        )}

        {subMode === 'forgot' && (
          <Pressable onPress={() => setSubMode('login')}>
            <Text style={styles.linkPrimary}>Girişe dön</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5FC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backBtn: { color: '#3D1A78', fontWeight: '600', fontSize: 14 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A0A2E' },
  form: { padding: 24, gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A0A2E' },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E8E0F4',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A0A2E',
    backgroundColor: '#FFFFFF',
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#3D1A78',
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  linkPrimary: { textAlign: 'center', marginTop: 16, fontSize: 14, color: '#3D1A78', fontWeight: '600' },
  linkMuted: { textAlign: 'center', marginTop: 16, fontSize: 14, color: '#7A6B8A' },
  linkBold: { color: '#3D1A78', fontWeight: '700' },
  messageBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  messageText: { color: '#B91C1C', fontSize: 13, fontWeight: '600' },
  successBox: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  successText: { color: '#166534' },
});

function firebaseAuthError(e: { code?: string; message?: string }): string {
  switch (e.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta veya şifre hatalı';
    case 'auth/email-already-in-use':
      return 'Bu e-posta zaten kayıtlı';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalı';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme. Lütfen biraz bekleyin';
    default:
      return e.message ?? 'İşlem başarısız';
  }
}
