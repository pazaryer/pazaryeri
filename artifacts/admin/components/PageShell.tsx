import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME, SPACING, RADIUS } from '@/lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
};

export function PageShell({
  title,
  subtitle,
  children,
  headerRight,
  scroll = true,
  refreshing,
  onRefresh,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  const padBottom = 100 + insets.bottom;

  const header = (
    <View style={styles.headerCard}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {headerRight}
      </View>
    </View>
  );

  if (!scroll) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, style]}>
        {header}
        <View style={[styles.body, styles.bodyFlex, { paddingBottom: padBottom }]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }, style]}>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: padBottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />
          ) : undefined
        }
      >
        {header}
        {children}
      </ScrollView>
    </View>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionLine} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function FilterRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.filterRow}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: THEME.bg },
  headerCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.textMuted,
    marginTop: 6,
    lineHeight: 18,
  },
  body: { paddingHorizontal: SPACING.md },
  bodyFlex: { flex: 1 },
  section: { marginBottom: SPACING.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.md },
  sectionLine: { width: 3, height: 18, borderRadius: 2, backgroundColor: THEME.primary },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: THEME.text, letterSpacing: 0.2 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
});
