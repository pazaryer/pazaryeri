import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'login' | 'register' | 'forgot';

export default function EmailAuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const titles: Record<Mode, string> = {
    login: 'E-posta ile Giriş',
    register: 'Hesap Oluştur',
    forgot: 'Şifre Sıfırla',
  };

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        if (password.length < 6) {
          Alert.alert('Hata', 'Şifre en az 6 karakter olmalı');
          return;
        }
        await signInWithEmail(email, password);
      } else if (mode === 'register') {
        if (name.trim().length < 2) {
          Alert.alert('Hata', 'Adınızı girin');
          return;
        }
        if (password.length < 6) {
          Alert.alert('Hata', 'Şifre en az 6 karakter olmalı');
          return;
        }
        await signUpWithEmail(email, password, name);
      } else {
        await resetPassword(email);
        Alert.alert('Başarılı', 'Şifre sıfırlama bağlantısı e-postanıza gönderildi');
        setMode('login');
      }
    } catch (e: any) {
      const msg =
        e.code === 'auth/invalid-credential'
          ? 'E-posta veya şifre hatalı'
          : e.code === 'auth/email-already-in-use'
            ? 'Bu e-posta zaten kayıtlı'
            : e.message ?? 'İşlem başarısız';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>{titles[mode]}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {mode === 'register' && (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>Ad Soyad</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Adınız"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </>
        )}

        <Text style={[styles.label, { color: colors.foreground }]}>E-posta</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="ornek@email.com"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {mode !== 'forgot' && (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>Şifre</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="En az 6 karakter"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </>
        )}

        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Kayıt Ol' : 'Sıfırlama Gönder'}
            </Text>
          )}
        </Pressable>

        {mode === 'login' && (
          <>
            <Pressable onPress={() => setMode('forgot')}>
              <Text style={[styles.link, { color: colors.primary }]}>Şifremi unuttum</Text>
            </Pressable>
            <Pressable onPress={() => setMode('register')}>
              <Text style={[styles.link, { color: colors.mutedForeground }]}>
                Hesabın yok mu? <Text style={{ color: colors.primary, fontWeight: '600' }}>Kayıt ol</Text>
              </Text>
            </Pressable>
          </>
        )}

        {mode === 'register' && (
          <Pressable onPress={() => setMode('login')}>
            <Text style={[styles.link, { color: colors.mutedForeground }]}>
              Zaten hesabın var mı? <Text style={{ color: colors.primary, fontWeight: '600' }}>Giriş yap</Text>
            </Text>
          </Pressable>
        )}

        {mode === 'forgot' && (
          <Pressable onPress={() => setMode('login')}>
            <Text style={[styles.link, { color: colors.primary }]}>Girişe dön</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700' },
  form: { padding: 24, gap: 12 },
  label: { fontSize: 16, fontWeight: '600' },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', marginTop: 16, fontSize: 14 },
});
