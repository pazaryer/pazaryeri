import { Platform, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BRAND } from '@/constants/brand';

/**
 * Yedek OAuth dönüş ekranı. Mobil akış native deep link kullanır.
 * Web köprüsü için public/oauth/app-return.html kullanılır.
 */
export default function OAuthAppReturnScreen() {
  const { error } = useLocalSearchParams<{ error?: string }>();

  return (
    <View style={styles.wrap}>
      {error ? (
        <>
          <Text style={styles.title}>Giriş tamamlanamadı</Text>
          <Text style={styles.sub}>{String(error)}</Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>Giriş tamamlandı</Text>
          <Text style={styles.sub}>Uygulamaya dönün.</Text>
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
});
