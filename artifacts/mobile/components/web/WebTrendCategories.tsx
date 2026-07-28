import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { WEB_CATEGORIES } from '@/lib/categories';
import { WEB_THEME } from '@/lib/web-theme';
import { flatStyle } from '@/lib/flat-style';

const TREND_ITEMS = [
  { label: 'Yeni İlanlar', icon: '✨', category: 'Tümü' },
  { label: 'Ücretsiz', icon: '🎁', category: 'Tümü' },
  ...WEB_CATEGORIES.filter((c) =>
    ['Telefon', 'Elektronik', 'Araç', 'Mobilya', 'Moda', 'Spor', 'Bebek', 'Emlak'].includes(c.label),
  ).map((c) => ({ label: c.label, icon: c.icon, category: c.label, href: c.href })),
];

type Props = {
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
};

export function WebTrendCategories({ selectedCategory = 'Tümü', onCategorySelect }: Props) {
  const { width } = useWindowDimensions();
  const mobile = width < 640;

  return (
    <View style={[styles.wrap, mobile && styles.wrapMobile]}>
      <View style={styles.header}>
        <Text style={styles.title}>Trend Kategoriler</Text>
        <Link href="/kesfet" asChild>
          <Pressable>
            <Text style={styles.seeAll}>Tümünü Gör</Text>
          </Pressable>
        </Link>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TREND_ITEMS.map((item) => {
          const active = selectedCategory === item.category && item.category !== 'Tümü';
          const inner = (
            <Pressable
              style={flatStyle(styles.card, mobile && styles.cardMobile, active && styles.cardActive)}
              onPress={() => onCategorySelect?.(item.category)}
            >
              <View style={[styles.iconBg, active && styles.iconBgActive]}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={2}>
                {item.label}
              </Text>
            </Pressable>
          );

          if (onCategorySelect) {
            return <View key={item.label}>{inner}</View>;
          }

          return (
            <Link key={item.label} href={(item as { href?: string }).href ?? '/kesfet'} asChild>
              {inner}
            </Link>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  wrapMobile: { paddingHorizontal: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: '800', color: WEB_THEME.text },
  seeAll: { fontSize: 13, fontWeight: '700', color: WEB_THEME.brand },
  row: { gap: 10, paddingRight: 16 },
  card: { width: 80, alignItems: 'center', gap: 6 },
  cardMobile: { width: 72 },
  cardActive: {},
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: WEB_THEME.sectionTint,
    borderWidth: 1.5,
    borderColor: WEB_THEME.sectionTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgActive: {
    borderColor: WEB_THEME.accent,
    backgroundColor: '#FFF0EF',
  },
  icon: { fontSize: 26 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: WEB_THEME.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  labelActive: { color: WEB_THEME.accent, fontWeight: '800' },
});
