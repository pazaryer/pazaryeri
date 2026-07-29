import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { AppIcon, APP_ICON_SIZES, type AppIconSize } from '@/components/AppIcon';
import { useBrand } from '@/contexts/BrandContext';

type Props = {
  size?: AppIconSize;
  showName?: boolean;
  subtitle?: string;
  centered?: boolean;
  style?: ViewStyle;
};

export function AppBrandMark({
  size = 'lg',
  showName = false,
  subtitle,
  centered = false,
  style,
}: Props) {
  const brand = useBrand();
  const px = typeof size === 'number' ? size : APP_ICON_SIZES[size];

  return (
    <View style={[styles.row, centered && styles.centered, style]}>
      <AppIcon size={px} variant="app" />
      {showName && (
        <View style={styles.textCol}>
          <Text style={[styles.name, { fontSize: Math.max(18, px * 0.34), color: brand.primary }]}>
            {brand.name}
          </Text>
          {subtitle ? <Text style={[styles.subtitle, { color: brand.textMuted }]}>{subtitle}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  centered: {
    flexDirection: 'column',
    gap: 10,
  },
  textCol: { gap: 2 },
  name: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
});
