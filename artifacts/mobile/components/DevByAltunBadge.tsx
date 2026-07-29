import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable, type ViewStyle } from 'react-native';
import { getMobileDeveloper } from '@/lib/remote-config';

type Props = {
  compact?: boolean;
  style?: ViewStyle;
};

export function DevByAltunBadge({ compact, style }: Props) {
  const dev = getMobileDeveloper();
  if (!dev.enabled) return null;

  const label = dev.signatureLabel || 'Dev / ByAltun';
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]} accessibilityRole="text">
      <View style={[styles.pill, compact && styles.pillCompact]}>
        <Text
          style={[styles.glow, compact && styles.glowCompact, isWeb && styles.glowWeb]}
          aria-hidden
        >
          {label}
        </Text>
        <Text style={[styles.main, compact && styles.mainCompact, isWeb && styles.mainWeb]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  wrapCompact: { paddingVertical: 12 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(26, 10, 46, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(245, 215, 142, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  pillCompact: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  glow: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: '#FDE68A',
    opacity: 0.5,
    textShadowColor: '#38BDF8',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  glowCompact: { fontSize: 12, letterSpacing: 2 },
  glowWeb: Platform.OS === 'web' ? ({
    textShadow: '0 0 12px #38BDF8, 0 0 24px #F472B6, 0 0 36px rgba(251,191,36,0.5)',
  } as object) : {},
  main: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: '#FFF7D6',
    textShadowColor: '#F59E0B',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  mainCompact: { fontSize: 12, letterSpacing: 2 },
  mainWeb: Platform.OS === 'web' ? ({
    textShadow: '0 0 8px #FDE68A, 0 0 16px #FBBF24, 0 0 4px #FFFFFF',
  } as object) : {},
});
