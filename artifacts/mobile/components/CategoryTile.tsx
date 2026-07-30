import React from 'react';
import { View, Text, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '@/constants/brand';
import type { CategoryIconName } from '@/lib/categories';
import { categoryImageProps } from '@/lib/listing-image-props';

function toImageSource(image: ImageSource): ImageSource {
  if (typeof image === 'object' && image !== null && 'uri' in image && image.uri) {
    return image;
  }
  return image;
}

type Variant = 'mini' | 'micro';

type Props = {
  name: string;
  icon: CategoryIconName;
  image: ImageSource;
  gradient?: [string, string];
  active?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  variant?: Variant;
};

export const CategoryTile = React.memo(function CategoryTile({
  name,
  icon,
  image,
  gradient = ['#6B5B7A', '#3D3548'],
  active,
  onPress,
  style,
  variant = 'mini',
}: Props) {
  const micro = variant === 'micro';
  const resolved = toImageSource(image);

  return (
    <Pressable
      style={[
        styles.tile,
        micro ? styles.tileMicro : styles.tileMini,
        active && styles.tileActive,
        style,
      ]}
      onPress={onPress}
    >
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFillObject} />

      <Image
        source={resolved}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        recyclingKey={`cat-${name}`}
        {...categoryImageProps}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']}
        style={StyleSheet.absoluteFillObject}
      />

      {active ? <View style={styles.activeTint} /> : null}

      <View style={[styles.iconWrap, micro && styles.iconWrapMicro]}>
        <Ionicons name={icon} size={micro ? 14 : 16} color="#FFF" />
      </View>

      <Text style={[styles.label, micro && styles.labelMicro]} numberOfLines={2}>
        {name}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tile: {
    overflow: 'hidden',
    backgroundColor: '#4A4458',
  },
  tileMini: {
    width: 62,
    height: 76,
    borderRadius: 14,
  },
  tileMicro: {
    height: 64,
    borderRadius: 12,
  },
  tileActive: {
    borderWidth: 2,
    borderColor: BRAND.gold,
  },
  activeTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(61, 26, 120, 0.25)',
  },
  iconWrap: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapMicro: {
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  label: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 7,
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
    lineHeight: 11,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  labelMicro: {
    fontSize: 8,
    lineHeight: 10,
    bottom: 6,
  },
});
