import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { useSponsorBanner } from '@/lib/remote-config';
import { useColors } from '@/hooks/useColors';
import { useCompactScreen } from '@/hooks/useCompactScreen';
import { BRAND } from '@/constants/brand';
import {
  BANNER_BORDER_RADIUS,
  BANNER_INSET_H,
  useBannerLayout,
} from '@/lib/banner-layout';

type Props = {
  variant?: 'inline' | 'floating';
  style?: ViewStyle;
  /** floating: üst veya alt sabitleme */
  anchor?: 'top' | 'bottom';
  /** floating + top */
  top?: number;
  /** floating + bottom */
  bottom?: number;
};

export function SponsorBanner({
  variant = 'inline',
  style,
  anchor = 'bottom',
  top,
  bottom,
}: Props) {
  const colors = useColors();
  const sponsor = useSponsorBanner();
  const insets = useSafeAreaInsets();
  const compact = useCompactScreen();
  const segments = useSegments();
  const { width: bannerWidth, height: bannerHeight } = useBannerLayout();
  const inTabs = segments[0] === '(tabs)';
  const tabBarOffset = inTabs ? (compact ? 54 : 58) + insets.bottom : insets.bottom + 8;
  const floatingTop = top ?? insets.top + 6;
  const floatingBottom = bottom ?? tabBarOffset + 4;

  if (!sponsor.enabled || !sponsor.imageUrl) return null;

  const onPress = () => {
    if (!sponsor.linkUrl) return;
    void Linking.openURL(sponsor.linkUrl);
  };

  const content = (
    <View
      style={[
        styles.card,
        variant === 'floating' && styles.cardFloating,
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
          source={{ uri: sponsor.imageUrl }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={sponsor.altText}
        />
        <View style={[styles.badge, { backgroundColor: BRAND.primary }]}>
          <Text style={styles.badgeText}>SPONSOR</Text>
        </View>
      </View>
    </View>
  );

  if (variant === 'floating') {
    const anchorStyle =
      anchor === 'top'
        ? [styles.floatingWrap, styles.floatingTop, { top: floatingTop }]
        : [styles.floatingWrap, styles.floatingBottom, { bottom: floatingBottom }];

    return (
      <View pointerEvents="box-none" style={anchorStyle}>
        <Pressable
          onPress={onPress}
          disabled={!sponsor.linkUrl}
          style={({ pressed }) => [pressed && sponsor.linkUrl && styles.pressed]}
          accessibilityRole={sponsor.linkUrl ? 'link' : 'image'}
          accessibilityLabel={sponsor.altText}
        >
          {content}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.inlineWrap}>
      {!sponsor.linkUrl ? (
        content
      ) : (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [pressed && styles.pressed]}
          accessibilityRole="link"
          accessibilityLabel={sponsor.altText}
        >
          {content}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inlineWrap: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: BANNER_INSET_H,
  },
  floatingWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    elevation: 12,
    paddingHorizontal: BANNER_INSET_H,
    ...Platform.select({
      web: { position: 'fixed' as const },
    }),
  },
  floatingTop: { zIndex: 1000 },
  floatingBottom: { zIndex: 998 },
  card: {
    borderRadius: BANNER_BORDER_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 4,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardFloating: {
    marginVertical: 0,
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
