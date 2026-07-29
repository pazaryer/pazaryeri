import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BRAND } from '@/constants/brand';

/** Mobil anasayfa altı — kısa SEO metni (görünür, kibar) */
export function MobileSeoFooter() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Pazaryeri — İkinci El Alım Satım</Text>
      <Text style={styles.text}>
        Ücretsiz ilan ver, ikinci el telefon, araç, mobilya ve elektronik al-sat. Güvenli mesajlaşma ile
        Türkiye'nin modern pazaryeri uygulaması.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F8F5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0F4',
    gap: 6,
  },
  title: { fontSize: 13, fontWeight: '800', color: BRAND.primary },
  text: { fontSize: 11, lineHeight: 17, color: BRAND.textMuted, fontWeight: '500' },
});
