import React from 'react';
import { View, Text, StyleSheet, Platform, type ViewStyle } from 'react-native';

type Props = {
  compact?: boolean;
  style?: ViewStyle;
};

export function DevByAltunBadge({ compact, style }: Props) {
  const label = 'Dev / ByAltun';
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]} accessibilityRole="text">
      <Text
        style={[
          styles.glow,
          compact && styles.glowCompact,
          isWeb && styles.glowWeb,
        ]}
        aria-hidden
      >
        {label}
      </Text>
      <Text style={[styles.main, compact && styles.mainCompact, isWeb && styles.mainWeb]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  wrapCompact: { paddingVertical: 10 },
  glow: {
    position: 'absolute',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: '#67E8F9',
    opacity: 0.55,
    textShadowColor: '#22D3EE',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  glowCompact: { fontSize: 11, letterSpacing: 1.8 },
  glowWeb: Platform.OS === 'web' ? ({
    textShadow: '0 0 10px #22D3EE, 0 0 22px #A855F7, 0 0 32px rgba(34,211,238,0.45)',
  } as object) : {},
  main: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: '#E0F2FE',
    textShadowColor: '#A855F7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  mainCompact: { fontSize: 11, letterSpacing: 1.8 },
  mainWeb: Platform.OS === 'web' ? ({
    textShadow: '0 0 6px #E0F2FE, 0 0 14px #C084FC',
  } as object) : {},
});
