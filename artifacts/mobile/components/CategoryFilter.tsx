import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Tümü: 'apps',
  Elektronik: 'phone-portrait',
  Araç: 'car-sport',
  Mobilya: 'bed',
  Moda: 'shirt',
  Spor: 'fitness',
  Ev: 'home',
  'Ev Aletleri': 'tv',
  Diğer: 'ellipsis-horizontal',
};

export function CategoryFilter({ categories, selectedCategory, onSelect }: CategoryFilterProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const selected = category === selectedCategory;
        return (
          <Pressable
            key={category}
            onPress={() => onSelect(category)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.primary : colors.card,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons
              name={ICONS[category] ?? 'grid'}
              size={14}
              color={selected ? '#FFF' : colors.mutedForeground}
            />
            <Text style={[styles.chipText, { color: selected ? '#FFF' : colors.foreground }]}>
              {category}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
});
