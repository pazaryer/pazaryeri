import { Link, Stack } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { WebShell } from '@/components/web/WebShell';

export default function NotFoundScreen() {
  const colors = useColors();

  const body = (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.emoji}>🔍</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Sayfa bulunamadı</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Aradığınız sayfa mevcut değil veya kaldırılmış olabilir.
      </Text>
      <Link href="/" style={styles.link}>
        <Text style={[styles.linkText, { color: colors.primary }]}>Ana Sayfaya Dön</Text>
      </Link>
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <>
        <Stack.Screen options={{ title: 'Sayfa Bulunamadı' }} />
        <WebShell>{body}</WebShell>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Sayfa Bulunamadı' }} />
      {body}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 400 },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  link: { paddingVertical: 12, paddingHorizontal: 24 },
  linkText: { fontSize: 15, fontWeight: '700' },
});
