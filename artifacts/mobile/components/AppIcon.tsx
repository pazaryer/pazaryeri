import React from 'react';
import { View, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useBrand } from '@/contexts/BrandContext';

export const APP_ICON_SIZES = {
  xs: 28,
  sm: 40,
  md: 56,
  lg: 72,
  xl: 96,
  hero: 112,
} as const;

export type AppIconSize = keyof typeof APP_ICON_SIZES | number;

type Variant = 'app' | 'splash' | 'plain';

type Props = {
  size?: AppIconSize;
  variant?: Variant;
  style?: ViewStyle | ImageStyle;
};

const ICON_SOURCE = require('@/assets/images/icon.png');

function resolveSize(size: AppIconSize): number {
  return typeof size === 'number' ? size : APP_ICON_SIZES[size];
}

export function AppIcon({ size = 'md', variant = 'app', style }: Props) {
  const brand = useBrand();
  const px = resolveSize(size);
  const radius = Math.round(px * (variant === 'plain' ? 0.2 : 0.22));
  const imageInset = variant === 'splash' ? 0 : Math.max(0, Math.round(px * 0.02));
  const remoteIcon = brand.assets.iconUrl;
  const source = remoteIcon ? { uri: remoteIcon } : ICON_SOURCE;

  if (variant === 'plain') {
    return (
      <Image
        source={source}
        style={[{ width: px, height: px, borderRadius: radius }, style]}
        contentFit="cover"
        transition={100}
      />
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        variant === 'splash' && styles.wrapSplash,
        {
          width: px,
          height: px,
          borderRadius: radius,
          backgroundColor: brand.primary,
          shadowColor: brand.primaryDark,
          shadowRadius: px * 0.12,
          shadowOffset: { width: 0, height: px * 0.04 },
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={{
          width: px - imageInset * 2,
          height: px - imageInset * 2,
          borderRadius: radius - imageInset,
        }}
        contentFit="cover"
        transition={100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.22,
    elevation: 4,
  },
  wrapSplash: {
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
