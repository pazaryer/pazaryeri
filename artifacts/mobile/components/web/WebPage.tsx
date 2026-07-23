import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface WebPageProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  narrow?: boolean;
  style?: ViewStyle;
}

/** Web sayfaları için tam genişlik, beyaz içerik alanı */
export function WebPage({ title, subtitle, children, narrow, style }: WebPageProps) {
  return (
    <View style={[styles.page, style]}>
      <View style={[styles.inner, narrow && styles.innerNarrow]}>
        {(title || subtitle) && (
          <View style={styles.header}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#F7F5FC',
    minHeight: 400,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  inner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  innerNarrow: { maxWidth: 720 },
  header: { marginBottom: 28, gap: 6 },
  title: { fontSize: 32, fontWeight: '800', color: '#1A0A2E', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#7A6B8A', lineHeight: 24 },
});
