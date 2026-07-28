import { Platform, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BRAND } from '@/constants/brand';

/**
 * Google OAuth dönüş sayfası (mobil Custom Tab).
 * Android'de pazaryeri:// yerine HTTPS kullanılır — tarayıcı oturumu burada kapanır.
 */
export default function OAuthAppReturnScreen() {
  const { error } = useLocalSearchParams<{ id_token?: string; error?: string }>();

  return (
    <View style={styles.wrap}>
      {error ? (
        <>
          <Text style={styles.title}>Giriş tamamlanamadı</Text>
          <Text style={styles.sub}>{String(error)}</Text>
          <Text style={styles.hint}>Uygulamaya dönüp tekrar deneyin.</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={BRAND.primary} />
          <Text style={styles.title}>Giriş başarılı</Text>
          <Text style={styles.sub}>Uygulamaya dönülüyor...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: BRAND.background,
    gap: 12,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  title: { fontSize: 18, fontWeight: '700', color: BRAND.text, textAlign: 'center' },
  sub: { fontSize: 14, color: BRAND.textMuted, textAlign: 'center', lineHeight: 20 },
  hint: { fontSize: 13, color: BRAND.textLight, marginTop: 8, textAlign: 'center' },
});
