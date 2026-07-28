import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { WEB_CATEGORIES } from '@/lib/categories';
import { WEB_THEME } from '@/lib/web-theme';
import { flatStyle } from '@/lib/flat-style';

const TREND_ITEMS = [
  { label: 'Yeni İlanlar', icon: '✨', href: '/kesfet' },
  { label: 'Ücretsiz', icon: '🎁', href: '/kesfet' },
  ...WEB_CATEGORIES.filter((c) =>
    ['Telefon', 'Elektronik', 'Araç', 'Mobilya', 'Moda', 'Spor', 'Bebek', 'Emlak'].includes(c.label),
  ).map((c) => ({ label: c.label, icon: c.icon, href: c.href })),
];

export function WebTrendCategories() {
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {TREND_ITEMS.map((item) => (
          <Link key={item.label} href={item.href as any} asChild>
            <Pressable style={flatStyle(styles.card, mobile && styles.cardMobile)}>
              <View style={styles.iconBg}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <Text style={styles.label} numberOfLines={2}>
                {item.label}
              </Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: WEB_THEME.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  wrapMobile: { paddingHorizontal: 12, paddingTop: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '800', color: WEB_THEME.text },
  seeAll: { fontSize: 13, fontWeight: '700', color: WEB_THEME.brand },
  row: { gap: 10, paddingRight: 16 },
  card: {
    width: 88,
    alignItems: 'center',
    gap: 8,
  },
  cardMobile: { width: 76 },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: WEB_THEME.sectionTint,
    borderWidth: 1,
    borderColor: WEB_THEME.sectionTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 28 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: WEB_THEME.text,
    textAlign: 'center',
    lineHeight: 14,
  },
});
