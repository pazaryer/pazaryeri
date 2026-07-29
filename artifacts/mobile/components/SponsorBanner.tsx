import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { BRAND } from '@/constants/brand';
import { BANNER_BORDER_RADIUS, BANNER_INSET_H, useBannerLayout } from '@/lib/banner-layout';
import type { SponsorBannerItem } from '@/lib/sponsor-placements';

export type SponsorBannerData = Pick<
  SponsorBannerItem,
  'enabled' | 'imageUrl' | 'linkUrl' | 'altText'
>;

type Props = {
  banner: SponsorBannerData | null;
  style?: ViewStyle;
};

/** Satır içi sponsor banner — sayfa akışında, üst üste binmez. */
export function SponsorBanner({ banner, style }: Props) {
  const colors = useColors();
  const { width: bannerWidth, height: bannerHeight } = useBannerLayout();

  if (!banner?.enabled || !banner.imageUrl) return null;

  const onPress = () => {
    if (!banner.linkUrl) return;
    void Linking.openURL(banner.linkUrl);
  };

  const content = (
    <View
      style={[
        styles.card,
        {
          width: bannerWidth,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        style,
      ]}
    >
      <View style={[styles.imageWrap, { height: bannerHeight }]}>
        <Image
          source={{ uri: banner.imageUrl }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={banner.altText}
        />
        <View style={[styles.badge, { backgroundColor: BRAND.primary }]}>
          <Text style={styles.badgeText}>SPONSOR</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.wrap}>
      {!banner.linkUrl ? (
        content
      ) : (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [pressed && styles.pressed]}
          accessibilityRole="link"
          accessibilityLabel={banner.altText}
        >
          {content}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: BANNER_INSET_H,
    marginVertical: 6,
  },
  card: {
    borderRadius: BANNER_BORDER_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrap: {
    width: '100%',
    backgroundColor: '#F3EFFF',
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 3,
    left: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    opacity: 0.9,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
});
