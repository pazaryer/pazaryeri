import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MOBILE_EXPLORE_CATEGORIES } from '@/lib/categories';

const EXTRA = [
  { label: 'Yeni İlanlar', icon: '✨', category: 'Tümü' },
  { label: 'Ücretsiz', icon: '🎁', category: 'Tümü' },
];

const ITEMS = [
  ...EXTRA,
  ...MOBILE_EXPLORE_CATEGORIES.slice(0, 8).map((c) => ({
    label: c.name,
    icon: '📦',
    category: c.name,
  })),
];

type Props = {
  selected: string;
  onSelect: (category: string) => void;
};

export function MobileTrendCategories({ selected, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Trend Kategoriler</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {ITEMS.map((item) => {
          const active = selected === item.category && item.category !== 'Tümü';
          return (
            <Pressable key={item.label} style={styles.card} onPress={() => onSelect(item.category)}>
              <View style={[styles.iconBg, active && styles.iconBgActive]}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={2}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 4 },
  header: { paddingHorizontal: 10, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '800', color: '#2C2C2C' },
  row: { paddingHorizontal: 8, gap: 8 },
  card: { width: 72, alignItems: 'center', gap: 6 },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF5FC',
    borderWidth: 1,
    borderColor: '#D6E8F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgActive: { borderColor: '#FF3B30', backgroundColor: '#FFF0EF' },
  icon: { fontSize: 24 },
  label: { fontSize: 10, fontWeight: '600', color: '#717171', textAlign: 'center', lineHeight: 13 },
  labelActive: { color: '#FF3B30', fontWeight: '800' },
});
