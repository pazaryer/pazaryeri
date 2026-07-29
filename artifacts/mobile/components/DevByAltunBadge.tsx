import React from 'react';
import { View, Text, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { getMobileDeveloper } from '@/lib/remote-config';

type Props = {
  compact?: boolean;
  style?: ViewStyle;
};

export function DevByAltunBadge({ compact, style }: Props) {
  const dev = getMobileDeveloper();
  if (!dev.enabled) return null;

  const label = dev.signatureLabel || 'dev/ByAltun';
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]} accessibilityRole="text">
      <Text style={[styles.main, compact && styles.mainCompact, isWeb && styles.mainWeb]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  wrapCompact: { paddingVertical: 6 },
  main: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: 'rgba(90, 61, 138, 0.75)',
    textShadowColor: 'rgba(168, 85, 247, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  mainCompact: { fontSize: 10 },
  mainWeb: Platform.OS === 'web' ? ({
    textShadow: '0 0 8px rgba(168, 85, 247, 0.25)',
  } as object) : {},
});
