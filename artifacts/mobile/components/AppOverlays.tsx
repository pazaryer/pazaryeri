import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { AdMobBannerSlot } from '@/components/AdMobBannerSlot';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAdMobConfig } from '@/lib/admob/config';
import { isAdMobSupported } from '@/lib/admob/native';
import { useCompactScreen } from '@/hooks/useCompactScreen';

const STACK_GAP = 6;

function AdMobOverlayFallback() {
  return null;
}

export function AppOverlays() {
  const insets = useSafeAreaInsets();
  const compact = useCompactScreen();
  const segments = useSegments();
  const admob = useAdMobConfig();
  const inTabs = segments[0] === '(tabs)';
  const tabBarOffset = inTabs ? (compact ? 54 : 58) + insets.bottom : insets.bottom + 8;

  if (Platform.OS === 'web' || !isAdMobSupported() || !admob.banner.enabled) {
    return null;
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      <ErrorBoundary FallbackComponent={AdMobOverlayFallback}>
        <AdMobBannerSlot bottom={tabBarOffset + STACK_GAP} />
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
    elevation: 11,
  },
});
