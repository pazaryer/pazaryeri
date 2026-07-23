import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { WEB_CATEGORIES } from '@/lib/categories';

export function WebCategoryGrid() {
  const items = WEB_CATEGORIES.filter((c) => c.label !== 'Tüm İlanlar');

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <Text style={styles.title}>Kategoriler</Text>
        <View nativeID="pz-category-grid" style={styles.grid}>
          {items.map((cat) => (
            <Link key={cat.label} href={cat.href as any} asChild>
              <Pressable style={styles.card}>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>{cat.icon}</Text>
                </View>
                <Text style={styles.label} numberOfLines={1}>
                  {cat.label}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  inner: { maxWidth: 1400, width: '100%', alignSelf: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: '#1A0A2E', marginBottom: 12 },
  grid: { width: '100%' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8E0F4',
    minHeight: 90,
    justifyContent: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F4F1FA',
    borderWidth: 1,
    borderColor: '#E8E0F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 22 },
  label: { fontSize: 12, fontWeight: '700', color: '#3D1A78', textAlign: 'center' },
});
