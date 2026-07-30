import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { AdMobBannerSlot } from '@/components/AdMobBannerSlot';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAdMobConfig } from '@/lib/admob/config';
import { isAdMobSupported } from '@/lib/admob/native';
import { useCompactScreen } from '@/hooks/useCompactScreen';
import { getAdBannerBottomOffset, shouldShowAdBanner } from '@/lib/ad-banner-inset';

function AdMobOverlayFallback() {
  return null;
}

export function AppOverlays() {
  const insets = useSafeAreaInsets();
  const compact = useCompactScreen();
  const segments = useSegments();
  const admob = useAdMobConfig();
  const showBanner = shouldShowAdBanner(segments) && admob.banner.enabled;

  if (Platform.OS === 'web' || !isAdMobSupported() || !showBanner) {
    return null;
  }

  const bottom = getAdBannerBottomOffset(compact, insets.bottom);

  return (
    <View style={styles.root} pointerEvents="box-none">
      <ErrorBoundary FallbackComponent={AdMobOverlayFallback}>
        <AdMobBannerSlot bottom={bottom} />
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
