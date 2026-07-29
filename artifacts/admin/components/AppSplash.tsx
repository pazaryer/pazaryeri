import { useEffect, useCallback } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { THEME } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export function AppSplash({ onReady }: { onReady: () => void }) {
  const hide = useCallback(async () => {
    await SplashScreen.hideAsync().catch(() => {});
    onReady();
  }, [onReady]);

  useEffect(() => {
    const t = setTimeout(hide, 1200);
    return () => clearTimeout(t);
  }, [hide]);

  return (
    <View style={styles.wrap}>
      <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Pazaryeri</Text>
      <Text style={styles.sub}>Admin Panel</Text>
      <View style={styles.bar}>
        <View style={styles.barFill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bg,
  },
  logo: { width: 100, height: 100, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.primary,
    letterSpacing: 1,
  },
  sub: {
    fontSize: 13,
    color: THEME.textMuted,
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 28,
    textTransform: 'uppercase',
  },
  bar: {
    width: 140,
    height: 3,
    backgroundColor: THEME.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    width: '65%',
    height: '100%',
    backgroundColor: THEME.primary,
    borderRadius: 2,
  },
});
