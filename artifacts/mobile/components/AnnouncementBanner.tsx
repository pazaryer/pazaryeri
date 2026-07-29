import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ANNOUNCEMENTS } from '@/lib/categories';
import { WebMarquee, MarqueeSlot } from '@/components/WebMarquee';
import { BRAND } from '@/constants/brand';

const MARQUEE_TEXT = ANNOUNCEMENTS.join('   ·   ') + '   ·   ';

type Props = {
  /** Anasayfa liste içinde — yuvarlatılmış kart stili */
  embedded?: boolean;
  /** İnce, kibar anasayfa bandı */
  subtle?: boolean;
  style?: ViewStyle;
};

/** Mobil — Reanimated kaydırma */
function NativeMarquee({ subtle }: { subtle?: boolean }) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-480, { duration: 22000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <MarqueeSlot>
      <Animated.View style={[styles.marqueeRow, animStyle]}>
        <Text style={[styles.marqueeText, subtle && styles.marqueeTextSubtle]}>{MARQUEE_TEXT}</Text>
        <Text style={[styles.marqueeText, subtle && styles.marqueeTextSubtle]}>{MARQUEE_TEXT}</Text>
      </Animated.View>
    </MarqueeSlot>
  );
}

export function AnnouncementBanner({ embedded, subtle, style }: Props) {
  const insets = useSafeAreaInsets();
  const topPad = !embedded && !subtle && Platform.OS !== 'web' ? insets.top : 0;
  const isSubtle = embedded || subtle;

  return (
    <View
      style={[
        styles.wrap,
        embedded && styles.wrapEmbedded,
        isSubtle && styles.wrapSubtle,
        topPad > 0 && { paddingTop: topPad, height: 38 + topPad },
        style,
      ]}
    >
      {!isSubtle && (
        <View style={[styles.badge, embedded && styles.badgeEmbedded]}>
          <Text style={styles.badgeText}>DUYURU</Text>
        </View>
      )}
      {isSubtle && <View style={styles.subtleAccent} />}
      {Platform.OS === 'web' ? (
        <WebMarquee text={MARQUEE_TEXT} subtle={isSubtle} />
      ) : (
        <NativeMarquee subtle={isSubtle} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#2A1260',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.3)',
    height: 38,
  },
  wrapEmbedded: {
    borderRadius: 12,
    borderBottomWidth: 0,
    height: 36,
    marginHorizontal: 14,
    marginBottom: 12,
    shadowColor: '#3D1A78',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  wrapSubtle: {
    backgroundColor: '#F3EFFF',
    borderWidth: 1,
    borderColor: '#E2D9F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E2D9F0',
    height: 32,
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  badge: {
    backgroundColor: '#C9A84C',
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    zIndex: 2,
    flexShrink: 0,
  },
  badgeEmbedded: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 12,
  },
  badgeText: {
    color: '#1A0A2E',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subtleAccent: {
    width: 3,
    height: '60%',
    backgroundColor: BRAND.primary,
    borderRadius: 2,
    marginLeft: 10,
    marginRight: 4,
    opacity: 0.7,
  },
  marqueeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 1600,
  },
  marqueeText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '600',
    paddingRight: 48,
    flexShrink: 0,
  },
  marqueeTextSubtle: {
    color: '#5A3D8A',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
