import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';
import { categoryEmoji } from '@/lib/category-icons';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}

const NATIVE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Tümü: 'apps',
  Elektronik: 'phone-portrait',
  Telefon: 'call',
  Bilgisayar: 'laptop',
  Araç: 'car-sport',
  Emlak: 'business',
  Mobilya: 'bed',
  'Ev & Bahçe': 'home',
  Moda: 'shirt',
  Spor: 'bicycle',
  Bebek: 'happy',
  Hobi: 'book',
  'İş & Ofis': 'briefcase',
  Hayvanlar: 'paw',
  Müzik: 'musical-notes',
  'Beyaz Eşya': 'snow',
  Kozmetik: 'sparkles',
  Antika: 'diamond',
  Diğer: 'ellipsis-horizontal',
};

export function CategoryFilter({ categories, selectedCategory, onSelect }: CategoryFilterProps) {
  const colors = useColors();
  const useEmoji = Platform.OS === 'web';
  const mobileWeb = useIsMobileWeb();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, mobileWeb && styles.containerMobile]}
    >
      {categories.map((category) => {
        const selected = category === selectedCategory;
        return (
          <Pressable
            key={category}
            onPress={() => onSelect(category)}
            style={[
              styles.chip,
              mobileWeb && styles.chipMobile,
              {
                backgroundColor: selected ? colors.primary : colors.card,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            {useEmoji ? (
              <Text style={[styles.emoji, mobileWeb && styles.emojiMobile]}>{categoryEmoji(category)}</Text>
            ) : (
              <Ionicons
                name={NATIVE_ICONS[category] ?? 'grid'}
                size={14}
                color={selected ? '#FFF' : colors.mutedForeground}
              />
            )}
            <Text style={[styles.chipText, mobileWeb && styles.chipTextMobile, { color: selected ? '#FFF' : colors.foreground }]}>
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
  containerMobile: { paddingHorizontal: 10, gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipMobile: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18 },
  emoji: { fontSize: 13 },
  emojiMobile: { fontSize: 12 },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipTextMobile: { fontSize: 11 },
});
