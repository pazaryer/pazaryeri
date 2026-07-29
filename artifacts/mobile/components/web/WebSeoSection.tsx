import React from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { WEB_CATEGORIES } from '@/lib/categories';
import { SEO_FAQ, SEO_POPULAR_SEARCHES } from '@/lib/seo';
import { WEB_THEME } from '@/lib/web-theme';

/** Anasayfa ve keşfet için görünür, SEO dostu içerik bloğu */
export function WebSeoSection({ compact }: { compact?: boolean }) {
  if (Platform.OS !== 'web') return null;

  const categories = WEB_CATEGORIES.filter((c) => c.label !== 'Tüm İlanlar');

  return (
    <View nativeID="pz-seo-section" style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.h1} accessibilityRole="header">
        Pazaryeri — Ücretsiz İkinci El Alım Satım Platformu
      </Text>
      <Text style={styles.lead}>
        Türkiye'nin modern pazaryeri uygulaması ile ikinci el telefon, araç, mobilya, elektronik ve daha
        fazlasını alın veya satın. Ücretsiz ilan verin, güvenli mesajlaşma ile alım satım yapın.
      </Text>

      <Text style={styles.h2}>Popüler Kategoriler</Text>
      <View style={styles.chipRow}>
        {categories.map((cat) => (
          <Link key={cat.label} href={cat.href as never} asChild>
            <Pressable style={styles.chip}>
              <Text style={styles.chipText}>{cat.label} İlanları</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <Text style={styles.h2}>Popüler Aramalar</Text>
      <View style={styles.chipRow}>
        {SEO_POPULAR_SEARCHES.map((item) => (
          <Link key={item.query} href={`/kesfet?q=${encodeURIComponent(item.query)}` as never} asChild>
            <Pressable style={styles.chipOutline}>
              <Text style={styles.chipOutlineText}>{item.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <Text style={styles.h2}>Sık Sorulan Sorular</Text>
      {SEO_FAQ.map((faq) => (
        <View key={faq.question} style={styles.faqItem}>
          <Text style={styles.faqQ}>{faq.question}</Text>
          <Text style={styles.faqA}>{faq.answer}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: WEB_THEME.maxWidth,
    width: '100%',
    alignSelf: 'center',
    marginHorizontal: 16,
    marginTop: 32,
    marginBottom: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2D9F0',
    gap: 14,
  },
  wrapCompact: { marginTop: 20, padding: 16 },
  h1: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A0A2E',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  lead: { fontSize: 14, color: '#7A6B8A', lineHeight: 22 },
  h2: { fontSize: 16, fontWeight: '800', color: '#3D1A78', marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#F3EFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2D9F0',
  },
  chipText: { fontSize: 12, fontWeight: '600', color: '#3D1A78' },
  chipOutline: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4C8E8',
    backgroundColor: '#FAFAFE',
  },
  chipOutlineText: { fontSize: 12, fontWeight: '500', color: '#5A3D8A' },
  faqItem: { gap: 4, paddingTop: 4 },
  faqQ: { fontSize: 14, fontWeight: '700', color: '#1A0A2E' },
  faqA: { fontSize: 13, color: '#7A6B8A', lineHeight: 20 },
});
