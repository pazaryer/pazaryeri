import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { SponsorBanner } from '@/components/SponsorBanner';
import { AdMobBannerSlot, ADMOB_BANNER_HEIGHT } from '@/components/AdMobBannerSlot';
import { useSponsorBanner } from '@/lib/remote-config';
import { useAdMobConfig } from '@/lib/admob/config';
import { useCompactScreen } from '@/hooks/useCompactScreen';

const SPONSOR_GAP = 6;
const STACK_GAP = 4;

/** Sponsor (üst) + AdMob (alt, tab bar'a yakın) — tek global katman. */
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

  const admobBottom = tabBarOffset + STACK_GAP;
  const sponsorBottom =
    admobBottom + (showAdMob ? ADMOB_BANNER_HEIGHT + SPONSOR_GAP : 0) + STACK_GAP;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {showAdMob ? <AdMobBannerSlot bottom={admobBottom} /> : null}
      {showSponsor ? <SponsorBanner variant="floating" bottom={sponsorBottom} /> : null}
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
