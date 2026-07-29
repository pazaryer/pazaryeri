import { useEffect, useCallback } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export function AppSplash({ onReady }: { onReady: () => void }) {
  const hide = useCallback(async () => {
    await SplashScreen.hideAsync().catch(() => {});
    onReady();
  }, [onReady]);

  useEffect(() => {
    const t = setTimeout(hide, 1400);
    return () => clearTimeout(t);
  }, [hide]);

  return (
    <LinearGradient colors={['#0F0A1A', '#2A1260', '#0F0A1A']} style={styles.wrap}>
      <View style={styles.glow} />
      <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>PAZARYERI</Text>
      <Text style={styles.sub}>ADMIN PANEL</Text>
      <View style={styles.bar}>
        <View style={styles.barFill} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bg,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(201,168,76,0.12)',
    top: '28%',
  },
  logo: { width: 120, height: 120, marginBottom: 20 },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.gold,
    letterSpacing: 6,
  },
  sub: {
    fontSize: 13,
    color: THEME.textMuted,
    letterSpacing: 8,
    marginTop: 6,
    marginBottom: 32,
  },
  bar: {
    width: 160,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    width: '70%',
    height: '100%',
    backgroundColor: THEME.gold,
    borderRadius: 2,
  },
});
