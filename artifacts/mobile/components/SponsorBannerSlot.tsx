import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SponsorBanner } from '@/components/SponsorBanner';
import { useSponsorForPlacement } from '@/lib/remote-config';
import type { SponsorPlacementId } from '@/lib/sponsor-placements';

type Props = {
  placement: SponsorPlacementId;
  style?: ViewStyle;
};

/** Sayfa bazlı sponsor banner — akış içinde, engel olmadan. */
export function SponsorBannerSlot({ placement, style }: Props) {
  const banner = useSponsorForPlacement(placement);
  if (!banner) return null;
  return (
    <View style={[styles.slot, style]}>
      <SponsorBanner banner={banner} />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: '100%',
  },
});
