import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useAdMobConfig, resolveBannerUnitId } from '@/lib/admob/config';
import { useAdMobSdkReady } from '@/lib/admob/init';
import { BRAND } from '@/constants/brand';
import { useColors } from '@/hooks/useColors';
import { BANNER_BORDER_RADIUS, BANNER_INSET_H, useBannerLayout } from '@/lib/banner-layout';

type Props = {
  bottom: number;
};

const NATIVE_BANNER_W = 320;
const NATIVE_BANNER_H = 50;

/** Tek global AdMob banner — alt orta, tab bar üstü. */
export function AdMobBannerSlot({ bottom }: Props) {
  const colors = useColors();
  const config = useAdMobConfig();
  const unitId = resolveBannerUnitId(config);
  const sdkReady = useAdMobSdkReady();
  const { width } = useBannerLayout();
  const [canMount, setCanMount] = useState(false);

  const adModule = useMemo(() => {
    if (Platform.OS === 'web') return null;
    try {
      return require('react-native-google-mobile-ads');
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!sdkReady || !config.banner.enabled || !unitId) {
      setCanMount(false);
      return;
    }
    const t = setTimeout(() => setCanMount(true), __DEV__ ? 400 : 100);
    return () => {
      clearTimeout(t);
      setCanMount(false);
    };
  }, [sdkReady, config.banner.enabled, unitId]);

  if (
    Platform.OS === 'web' ||
    !canMount ||
    !config.banner.enabled ||
    !unitId ||
    !adModule
  ) {
    return null;
  }

  const { BannerAd, BannerAdSize } = adModule;
  const cardWidth = Math.min(width, NATIVE_BANNER_W);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <View
        style={[
          styles.card,
          {
            width: cardWidth,
            height: NATIVE_BANNER_H,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: BRAND.primary }]}>
          <Text style={styles.badgeText}>Reklam</Text>
        </View>
        <BannerAd
          unitId={unitId}
          size={BannerAdSize.BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        />
      </View>
    </View>
  );
}

export const ADMOB_BANNER_HEIGHT = NATIVE_BANNER_H;

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
