import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { THEME, RADIUS, SPACING } from '@/lib/theme';

export type TableColumn = {
  key: string;
  title: string;
  flex?: number;
  width?: number;
  align?: 'left' | 'center' | 'right';
};

type Props<T> = {
  columns: TableColumn[];
  data: T[];
  keyExtractor: (item: T) => string;
  renderCell: (item: T, column: TableColumn) => React.ReactNode;
  onRowPress?: (item: T) => void;
  emptyMessage?: string;
  style?: ViewStyle;
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  renderCell,
  onRowPress,
  emptyMessage = 'Kayıt bulunamadı',
  style,
}: Props<T>) {
  if (!data.length) {
    return (
      <View style={[styles.empty, style]}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            {columns.map((col) => (
              <View
                key={col.key}
                style={[
                  styles.cell,
                  col.flex ? { flex: col.flex } : null,
                  col.width ? { width: col.width } : { minWidth: 100 },
                ]}
              >
                <Text style={[styles.headerText, col.align === 'right' && styles.alignRight]}>
                  {col.title}
                </Text>
              </View>
            ))}
          </View>
          {data.map((item, idx) => {
            const content = (
              <>
                {columns.map((col) => (
                  <View
                    key={col.key}
                    style={[
                      styles.cell,
                      col.flex ? { flex: col.flex } : null,
                      col.width ? { width: col.width } : { minWidth: 100 },
                    ]}
                  >
                    {renderCell(item, col)}
                  </View>
                ))}
              </>
            );
            if (onRowPress) {
              return (
                <Pressable
                  key={keyExtractor(item)}
                  onPress={() => onRowPress(item)}
                  style={({ pressed }) => [
                    styles.dataRow,
                    idx % 2 === 1 && styles.dataRowAlt,
                    pressed && styles.dataRowPressed,
                  ]}
                >
                  {content}
                </Pressable>
              );
            }
            return (
              <View key={keyExtractor(item)} style={[styles.dataRow, idx % 2 === 1 && styles.dataRowAlt]}>
                {content}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
    backgroundColor: THEME.surface,
  },
  table: { minWidth: '100%' },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.gold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
  },
  alignRight: { textAlign: 'right' },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderSoft,
  },
  dataRowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  dataRowPressed: { backgroundColor: 'rgba(139, 92, 246, 0.08)' },
  cell: { justifyContent: 'center' },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: THEME.borderSoft,
    backgroundColor: THEME.surface,
  },
  emptyText: { color: THEME.textMuted, fontSize: 14 },
});

export function CellText({
  children,
  muted,
  bold,
}: {
  children: React.ReactNode;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <Text
      style={[cellStyles.text, muted && cellStyles.muted, bold && cellStyles.bold]}
      numberOfLines={2}
    >
      {children}
    </Text>
  );
}

const cellStyles = StyleSheet.create({
  text: { fontSize: 13, color: THEME.textSoft, paddingHorizontal: 10 },
  muted: { color: THEME.textMuted, fontSize: 12 },
  bold: { fontWeight: '700', color: THEME.text },
});
