import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { SponsorBanner } from '@/components/SponsorBanner';
import { AdMobBannerSlot } from '@/components/AdMobBannerSlot';
import { useSponsorBanner } from '@/lib/remote-config';
import { useAdMobConfig } from '@/lib/admob/config';
import { useCompactScreen } from '@/hooks/useCompactScreen';

const STACK_GAP = 6;

/** Sponsor üstte, AdMob altta — ayrı konumlar, kompakt boyut. */
export function AppOverlays() {
  const insets = useSafeAreaInsets();
  const compact = useCompactScreen();
  const segments = useSegments();
  const sponsor = useSponsorBanner();
  const admob = useAdMobConfig();
  const inTabs = segments[0] === '(tabs)';
  const tabBarOffset = inTabs ? (compact ? 54 : 58) + insets.bottom : insets.bottom + 8;

  const showSponsor = sponsor.enabled && !!sponsor.imageUrl;
  const showAdMob = admob.banner.enabled && Platform.OS !== 'web';

  const sponsorTop = insets.top + STACK_GAP;
  const admobBottom = tabBarOffset + STACK_GAP;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {showSponsor ? (
        <SponsorBanner variant="floating" anchor="top" top={sponsorTop} />
      ) : null}
      {showAdMob ? <AdMobBannerSlot bottom={admobBottom} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 12,
  },
});
