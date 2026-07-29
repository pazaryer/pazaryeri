import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useAdMobConfig, resolveBannerUnitId } from '@/lib/admob/config';
import { BRAND } from '@/constants/brand';
import { useColors } from '@/hooks/useColors';
import {
  BANNER_BORDER_RADIUS,
  BANNER_INSET_H,
  useBannerLayout,
} from '@/lib/banner-layout';

type Props = {
  bottom: number;
};

/** Tek global AdMob banner — alt orta, tab bar üstü. */
export function AdMobBannerSlot({ bottom }: Props) {
  const colors = useColors();
  const config = useAdMobConfig();
  const unitId = resolveBannerUnitId(config);
  const { width, height, admobScale } = useBannerLayout();

  const adModule = useMemo(() => {
    if (Platform.OS === 'web') return null;
    try {
      return require('react-native-google-mobile-ads');
    } catch {
      return null;
    }
  }, []);

  if (Platform.OS === 'web' || !config.banner.enabled || !unitId || !adModule) return null;

  const { BannerAd, BannerAdSize } = adModule;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <View
        style={[
          styles.card,
          { width, height, borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: BRAND.primary }]}>
          <Text style={styles.badgeText}>Reklam</Text>
        </View>
        <View style={[styles.adClip, { width, height }]}>
          <View style={[styles.adScale, { transform: [{ scale: admobScale }] }]}>
            <BannerAd
              unitId={unitId}
              size={BannerAdSize.BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: false }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

/** Tab bar üstü boşluk hesabı için sabit yükseklik */
export function getAdMobBannerReserveHeight(bannerHeight: number): number {
  return bannerHeight + 8;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 998,
    elevation: 11,
    paddingHorizontal: BANNER_INSET_H,
  },
  card: {
    borderRadius: BANNER_BORDER_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  adClip: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adScale: {
    width: 320,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 5,
    zIndex: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    opacity: 0.88,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 6,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
