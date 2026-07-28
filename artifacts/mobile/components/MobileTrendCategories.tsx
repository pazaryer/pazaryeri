import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { BRAND } from '@/constants/brand';
import { MOBILE_EXPLORE_CATEGORIES } from '@/lib/categories';
import { CategoryTile } from '@/components/CategoryTile';

type Props = {
  selected: string;
  onSelect: (category: string) => void;
};

export function MobileTrendCategories({ selected, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Kategoriler</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Pressable
          style={[styles.allTile, selected === 'Tümü' && styles.allTileActive]}
          onPress={() => onSelect('Tümü')}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1607083206869-4c6b59bdfa1a?w=200&h=200&fit=crop&q=75' }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <View style={styles.allOverlay} />
          <Text style={styles.allLabel}>Tümü</Text>
        </Pressable>
        {MOBILE_EXPLORE_CATEGORIES.map((cat) => (
          <CategoryTile
            key={cat.name}
            name={cat.name}
            icon={cat.icon}
            image={cat.imageThumb}
            active={selected === cat.name}
            onPress={() => onSelect(cat.name)}
            variant="mini"
          />
        ))}
      </ScrollView>
    </View>
  );
}

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
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  allTileActive: { borderWidth: 1.5, borderColor: BRAND.gold },
  allOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(61, 26, 120, 0.5)',
  },
  allLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFF',
    zIndex: 1,
  },
});
