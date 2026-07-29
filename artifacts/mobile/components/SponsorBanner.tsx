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

/** AdMob standart banner oranı 320×50 */
const BANNER_ASPECT = 320 / 50;

type Props = {
  variant?: 'inline' | 'floating';
  style?: ViewStyle;
};

export function SponsorBanner({ variant = 'inline', style }: Props) {
  const colors = useColors();
  const sponsor = useSponsorBanner();
  const insets = useSafeAreaInsets();
  const compact = useCompactScreen();
  const segments = useSegments();
  const inTabs = segments[0] === '(tabs)';
  const tabBarOffset = inTabs ? (compact ? 54 : 58) + insets.bottom : insets.bottom + 8;

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
        { borderColor: colors.border, backgroundColor: colors.card },
        style,
      ]}
    >
      <View style={styles.imageWrap}>
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
    return (
      <View
        pointerEvents="box-none"
        style={[styles.floatingWrap, { bottom: tabBarOffset + 4 }]}
      >
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

  if (!sponsor.linkUrl) return content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
      accessibilityRole="link"
      accessibilityLabel={sponsor.altText}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floatingWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    elevation: 12,
    maxWidth: 728,
    alignSelf: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        position: 'fixed' as const,
        left: 16,
        right: 16,
        marginLeft: 'auto',
        marginRight: 'auto',
        maxWidth: 728,
      } as object,
    }),
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardFloating: {
    marginHorizontal: 0,
    marginVertical: 0,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: BANNER_ASPECT,
    backgroundColor: '#F3EFFF',
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 4,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    opacity: 0.92,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.998 }] },
});
