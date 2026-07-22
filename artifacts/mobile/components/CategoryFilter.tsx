import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}

const getCategoryIcon = (category: string, isSelected: boolean): keyof typeof Ionicons.glyphMap => {
  const map: Record<string, { outline: keyof typeof Ionicons.glyphMap, solid: keyof typeof Ionicons.glyphMap }> = {
    'Tümü': { outline: 'apps-outline', solid: 'apps' },
    'Elektronik': { outline: 'phone-portrait-outline', solid: 'phone-portrait' },
    'Araç': { outline: 'car-sport-outline', solid: 'car-sport' },
    'Mobilya': { outline: 'bed-outline', solid: 'bed' },
    'Moda': { outline: 'shirt-outline', solid: 'shirt' },
    'Spor': { outline: 'fitness-outline', solid: 'fitness' },
    'Ev': { outline: 'home-outline', solid: 'home' },
    'Ev Aletleri': { outline: 'home-outline', solid: 'home' },
    'Diğer': { outline: 'ellipsis-horizontal-circle-outline', solid: 'ellipsis-horizontal-circle' },
  };

  const defaultIcon = { outline: 'grid-outline' as const, solid: 'grid' as const };
  const iconSet = map[category] || defaultIcon;

  return isSelected ? iconSet.solid : iconSet.outline;
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
        const isSelected = category === selectedCategory;
        const iconColor = isSelected ? colors.primary : colors.mutedForeground;

        return (
          <Pressable
            key={category}
            onPress={() => onSelect(category)}
            style={styles.item}
          >
            <View style={styles.content}>
              <Ionicons 
                name={getCategoryIcon(category, isSelected)} 
                size={22} 
                color={iconColor} 
              />
              <Text
                style={[
                  styles.text,
                  { color: iconColor },
                ]}
              >
                {category}
              </Text>
              <View 
                style={[
                  styles.indicator, 
                  { backgroundColor: isSelected ? colors.primary : 'transparent' }
                ]} 
              />
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  indicator: {
    height: 2,
    width: '60%',
    marginTop: 4,
    borderRadius: 1,
  }
});