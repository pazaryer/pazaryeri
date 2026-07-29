import { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Btn, Input, Loading } from '@/components/ui';
import { THEME, RADIUS, SHADOW } from '@/lib/theme';
import { API_BASE_URL, checkApiHealth } from '@/lib/api';

export default function LoginScreen() {
  const { user, profile, isLoading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ ok: boolean; adminApi: boolean } | null>(null);

  useEffect(() => {
    checkApiHealth().then(setApiStatus);
  }, []);

  if (isLoading) return <Loading />;
  if (user && profile) return <Redirect href="/(tabs)" />;

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Hata', 'E-posta ve şifre gerekli');
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Giriş başarısız';
      Alert.alert('Giriş başarısız', msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.iconRing}>
              <Image source={require('@/assets/images/icon.png')} style={styles.icon} />
            </View>
            <Text style={styles.brand}>PAZARYERI</Text>
            <Text style={styles.brandSub}>YÖNETİM PANELİ</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.shieldIcon}>
                <Ionicons name="shield-checkmark" size={20} color={THEME.primary} />
              </View>
              <Text style={styles.cardTitle}>Güvenli Giriş</Text>
            </View>
            <Text style={styles.cardHint}>Sadece yetkili yöneticiler erişebilir</Text>

            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="E-posta adresi"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={styles.input}
            />
            <View style={styles.passWrap}>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Şifre"
                secureTextEntry={!showPass}
                autoComplete="password"
                style={[styles.input, styles.passInput]}
              />
              <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={THEME.textMuted}
                />
              </Pressable>
            </View>

            <Btn label="Giriş Yap" onPress={handleLogin} loading={busy} />

            {apiStatus && (
              <View style={[styles.statusPill, apiStatus.ok ? styles.statusOk : styles.statusWarn]}>
                <View
                  style={[styles.statusDot, { backgroundColor: apiStatus.ok ? THEME.success : THEME.warning }]}
                />
                <Text style={styles.statusText}>
                  API: {apiStatus.ok ? 'Bağlı' : 'Kapalı'}
                  {apiStatus.ok && !apiStatus.adminApi ? ' · Admin modülü deploy bekliyor' : ''}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.footer}>{API_BASE_URL}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  hero: { alignItems: 'center', marginBottom: 28 },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: THEME.primaryLight,
    borderWidth: 2,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOW.card,
  },
  icon: { width: 72, height: 72, borderRadius: 16 },
  brand: { fontSize: 28, fontWeight: '900', color: THEME.primary, letterSpacing: 4 },
  brandSub: { fontSize: 11, color: THEME.textMuted, letterSpacing: 5, marginTop: 4 },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: THEME.border,
    ...SHADOW.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  shieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: THEME.text },
  cardHint: { fontSize: 12, color: THEME.textMuted, marginBottom: 18 },
  input: { marginBottom: 12 },
  passWrap: { position: 'relative' },
  passInput: { paddingRight: 44 },
  eyeBtn: { position: 'absolute', right: 12, top: 12, padding: 4 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 10,
    borderRadius: RADIUS.sm,
  },
  statusOk: { backgroundColor: THEME.successBg },
  statusWarn: { backgroundColor: THEME.warningBg },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, color: THEME.textSoft, flex: 1 },
  footer: { textAlign: 'center', color: THEME.textMuted, fontSize: 10, marginTop: 20, opacity: 0.7 },
});
