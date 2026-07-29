import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { AdMobBannerSlot } from '@/components/AdMobBannerSlot';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAdMobConfig } from '@/lib/admob/config';
import { useCompactScreen } from '@/hooks/useCompactScreen';

const STACK_GAP = 6;

function AdMobOverlayFallback() {
  return null;
}

/** AdMob banner — yalnızca alt sabit katman (sponsor sayfa içinde). */
export function AppOverlays() {
  const insets = useSafeAreaInsets();
  const compact = useCompactScreen();
  const segments = useSegments();
  const admob = useAdMobConfig();
  const inTabs = segments[0] === '(tabs)';
  const tabBarOffset = inTabs ? (compact ? 54 : 58) + insets.bottom : insets.bottom + 8;

  const showAdMob = admob.banner.enabled && Platform.OS !== 'web';
  const admobBottom = tabBarOffset + STACK_GAP;

  if (!showAdMob) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <ErrorBoundary FallbackComponent={AdMobOverlayFallback}>
        <AdMobBannerSlot bottom={admobBottom} />
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
