import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useWebAppDownload } from '@/lib/remote-config';
import { BRAND } from '@/constants/brand';

const STORAGE_KEY = 'pz_native_app_installed';

type MobilePlatform = 'android' | 'ios' | null;

function detectMobilePlatform(): MobilePlatform {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return null;
}

function readInstalledFlag(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === '1';
}

function markInstalled(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Web: yüzen, animasyonlu uygulama indirme butonu. Uygulama yüklüyse gizlenir. */
export function WebAppDownloadFab() {
  const cfg = useWebAppDownload();
  const platform = useMemo(() => detectMobilePlatform(), []);
  const [hidden, setHidden] = useState(() => readInstalledFlag());
  const [dismissed, setDismissed] = useState(false);

  const floatY = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [floatY, pulse]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const markAndHide = () => {
      markInstalled();
      setHidden(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') markAndHide();
    };
    const onBlur = () => markAndHide();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: pulse.value }],
  }));

  const onDownload = useCallback(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const deepLink =
      platform === 'android'
        ? cfg.androidDeepLink
        : platform === 'ios'
          ? cfg.iosDeepLink
          : cfg.androidDeepLink;
    const storeUrl =
      platform === 'android'
        ? cfg.androidStoreUrl
        : platform === 'ios'
          ? cfg.iosStoreUrl
          : cfg.androidStoreUrl;

    const start = Date.now();
    window.location.href = deepLink || storeUrl;

    window.setTimeout(() => {
      if (Date.now() - start < 2200 && document.visibilityState === 'visible' && storeUrl) {
        window.location.href = storeUrl;
      }
    }, 1600);
  }, [cfg, platform]);

  if (Platform.OS !== 'web') return null;
  if (!cfg.enabled || hidden || dismissed) return null;
  if (!platform && !cfg.showOnDesktop) return null;

  return (
    <View style={styles.host} pointerEvents="box-none">
      <Animated.View style={[styles.fabWrap, animStyle]}>
        <Pressable onPress={onDownload} style={({ pressed }) => [pressed && styles.pressed]}>
          <LinearGradient
            colors={[BRAND.primary, BRAND.primaryMid, '#6B4BB5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>📲</Text>
            </View>
            <View style={styles.textCol}>
              <Text style={styles.title} numberOfLines={1}>
                {cfg.title}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {cfg.subtitle}
              </Text>
            </View>
            <View style={styles.ctaPill}>
              <Text style={styles.ctaText}>{cfg.buttonText}</Text>
            </View>
          </LinearGradient>
        </Pressable>
        <Pressable
          onPress={() => setDismissed(true)}
          style={styles.closeBtn}
          accessibilityLabel="Kapat"
          hitSlop={12}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'fixed' as const,
    right: 16,
    bottom: 24,
    zIndex: 10000,
    maxWidth: 360,
    width: 'min(100% - 32px, 360px)',
  },
  fabWrap: {
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.45)',
  },
  pressed: { opacity: 0.94 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  textCol: { flex: 1, minWidth: 0 },
  title: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.78)', fontSize: 11, marginTop: 2 },
  ctaPill: {
    backgroundColor: BRAND.gold,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ctaText: { color: BRAND.primaryDark, fontSize: 11, fontWeight: '900' },
  closeBtn: {
    position: 'absolute',
    top: -8,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
});
