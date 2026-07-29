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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { getSponsorBanner } from '@/lib/remote-config';
import { useColors } from '@/hooks/useColors';
import { useCompactScreen } from '@/hooks/useCompactScreen';
import { BRAND } from '@/constants/brand';

type Props = {
  variant?: 'inline' | 'floating';
  style?: ViewStyle;
};

export function SponsorBanner({ variant = 'inline', style }: Props) {
  const colors = useColors();
  const sponsor = getSponsorBanner();
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
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: BRAND.primary }]}>
          <Text style={styles.badgeText}>SPONSOR</Text>
        </View>
        {sponsor.linkUrl ? (
          <Ionicons name="open-outline" size={14} color={colors.mutedForeground} />
        ) : null}
      </View>
      <Image
        source={{ uri: sponsor.imageUrl }}
        style={styles.image}
        contentFit="cover"
        accessibilityLabel={sponsor.altText}
      />
    </View>
  );

  if (variant === 'floating') {
    return (
      <View
        pointerEvents="box-none"
        style={[styles.floatingWrap, { bottom: tabBarOffset + 6 }]}
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
    left: 12,
    right: 12,
    zIndex: 40,
    ...Platform.select({
      web: { position: 'fixed' as const },
    }),
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 12,
    marginVertical: 8,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  cardFloating: {
    marginHorizontal: 0,
    marginVertical: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  image: {
    width: '100%',
    height: 72,
    backgroundColor: '#F3EFFF',
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
});
