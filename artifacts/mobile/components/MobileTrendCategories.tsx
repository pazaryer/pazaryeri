import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '@/constants/brand';
import { CATEGORY_ALL_IMAGE, MOBILE_EXPLORE_CATEGORIES } from '@/lib/categories';
import { CategoryTile } from '@/components/CategoryTile';
import { categoryImageProps } from '@/lib/listing-image-props';

const ALL_GRADIENT: [string, string] = ['#9B7FD4', '#5C3D99'];

type Props = {
  selected: string;
  onSelect: (category: string) => void;
};

export const MobileTrendCategories = React.memo(function MobileTrendCategories({ selected, onSelect }: Props) {
  const allActive = selected === 'Tümü';

  useEffect(() => {
    const uris = [
      (CATEGORY_ALL_IMAGE as { uri?: string }).uri,
      ...MOBILE_EXPLORE_CATEGORIES.map((c) => (c.imageThumb as { uri?: string }).uri),
    ].filter(Boolean) as string[];
    void Image.prefetch(uris);
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Kategoriler</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Pressable
          style={[styles.allTile, allActive && styles.allTileActive]}
          onPress={() => onSelect('Tümü')}
        >
          <LinearGradient colors={ALL_GRADIENT} style={StyleSheet.absoluteFillObject} />
          <Image
            source={CATEGORY_ALL_IMAGE}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.45 }]}
            contentFit="cover"
            recyclingKey="cat-all"
            {...categoryImageProps}
          />
          <View style={styles.allOverlay} />
          <View style={styles.allIconWrap}>
            <Ionicons name="grid-outline" size={16} color="#FFF" />
          </View>
          <Text style={styles.allLabel}>Tümü</Text>
        </Pressable>
        {MOBILE_EXPLORE_CATEGORIES.map((cat) => (
          <CategoryTile
            key={cat.name}
            name={cat.name}
            icon={cat.icon}
            image={cat.imageThumb}
            gradient={cat.gradient}
            active={selected === cat.name}
            onPress={() => onSelect(cat.name)}
            variant="mini"
          />
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { paddingBottom: 4 },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.text,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  row: { paddingHorizontal: 10, gap: 8 },
  allTile: {
    width: 62,
    height: 76,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  allTileActive: { borderWidth: 2, borderColor: BRAND.gold },
  allOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(61, 26, 120, 0.35)',
  },
  allIconWrap: {
    position: 'absolute',
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
    zIndex: 1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
