import React from 'react';
import { View, Text, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '@/constants/brand';
import type { CategoryIconName } from '@/lib/categories';

type Variant = 'mini' | 'micro';

type Props = {
  name: string;
  icon: CategoryIconName;
  image: string;
  active?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  variant?: Variant;
};

export function CategoryTile({ name, icon, image, active, onPress, style, variant = 'mini' }: Props) {
  const micro = variant === 'micro';

  return (
    <Pressable
      style={[styles.tile, micro ? styles.tileMicro : styles.tileMini, active && styles.tileActive, style]}
      onPress={onPress}
    >
      <Image
        source={{ uri: image }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={150}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.5)']}
        style={StyleSheet.absoluteFillObject}
      />
      {!micro && (
        <View style={styles.iconBadge}>
          <Ionicons name={icon} size={11} color="#FFF" />
        </View>
      )}
      <Text style={[styles.label, micro && styles.labelMicro]} numberOfLines={2}>
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    overflow: 'hidden',
    backgroundColor: BRAND.primaryLight,
  },
  tileMini: {
    width: 62,
    height: 76,
    borderRadius: 12,
  },
  tileMicro: {
    height: 64,
    borderRadius: 10,
  },
  tileActive: {
    borderWidth: 1.5,
    borderColor: BRAND.gold,
  },
  iconBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    fontSize: 9,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 11,
    textAlign: 'center',
  },
  labelMicro: {
    fontSize: 8,
    lineHeight: 10,
    bottom: 5,
  },
});
