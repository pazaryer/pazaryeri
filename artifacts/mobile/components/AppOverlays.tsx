import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SponsorBanner } from '@/components/SponsorBanner';

/** Sponsor banner — tüm sayfalarda tab bar / alt kenar üstünde görünür. */
export function AppOverlays() {
  return (
    <View style={styles.root} pointerEvents="box-none">
      <SponsorBanner variant="floating" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 12,
    ...Platform.select({
      web: { position: 'fixed' as const },
    }),
  },
});
