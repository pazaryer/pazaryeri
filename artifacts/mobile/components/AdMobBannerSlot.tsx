import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { useCompactScreen } from '@/hooks/useCompactScreen';
import { useAdMobConfig, resolveBannerUnitId, ADMOB_BANNER_HEIGHT } from '@/lib/admob/config';
import { BRAND } from '@/constants/brand';
import { useColors } from '@/hooks/useColors';

type Props = {
  bottom: number;
};

/** Tek global AdMob banner — tüm sayfalarda aynı instance, tab bar'a en yakın katman. */
export function AdMobBannerSlot({ bottom }: Props) {
  const colors = useColors();
  const config = useAdMobConfig();
  const unitId = resolveBannerUnitId(config);

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
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
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

export { ADMOB_BANNER_HEIGHT };

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 998,
    elevation: 11,
    maxWidth: 728,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: ADMOB_BANNER_HEIGHT,
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
    top: 3,
    right: 6,
    zIndex: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    opacity: 0.9,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
