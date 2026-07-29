import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Input } from '@/components/ui';
import { THEME, SPACING, RADIUS } from '@/lib/theme';

export type AdMobUnitRow = {
  key: string;
  label: string;
  subtitle: string;
  accent: string;
  enabled: boolean;
  androidAppId: string;
  iosAppId: string;
  androidUnitId: string;
  iosUnitId: string;
};

type Props = {
  rows: AdMobUnitRow[];
  onChange: (key: string, patch: Partial<AdMobUnitRow>) => void;
  readOnly?: boolean;
};

const COL = {
  type: 108,
  on: 64,
  appId: 200,
  unitId: 200,
} as const;

export function AdMobTable({ rows, onChange, readOnly }: Props) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={styles.headerRow}>
            <Text style={[styles.th, { width: COL.type }]}>Reklam</Text>
            <Text style={[styles.th, { width: COL.on, textAlign: 'center' }]}>Açık</Text>
            <Text style={[styles.th, { width: COL.appId }]}>Android App ID</Text>
            <Text style={[styles.th, { width: COL.appId }]}>iOS App ID</Text>
            <Text style={[styles.th, { width: COL.unitId }]}>Android Unit ID</Text>
            <Text style={[styles.th, { width: COL.unitId }]}>iOS Unit ID</Text>
          </View>
          {rows.map((row, idx) => (
            <View key={row.key} style={[styles.dataRow, idx % 2 === 1 && styles.dataRowAlt]}>
              <View style={[styles.typeCell, { width: COL.type, borderLeftColor: row.accent }]}>
                <Text style={styles.typeLabel}>{row.label}</Text>
                <Text style={styles.typeSub}>{row.subtitle}</Text>
              </View>
              <View style={[styles.cell, { width: COL.on, alignItems: 'center' }]}>
                <Switch
                  value={row.enabled}
                  onValueChange={(v) => onChange(row.key, { enabled: v })}
                  disabled={readOnly}
                  trackColor={{ true: THEME.primary, false: THEME.border }}
                  thumbColor="#FFF"
                />
              </View>
              <View style={[styles.cell, { width: COL.appId }]}>
                <Input
                  value={row.androidAppId}
                  onChangeText={(v) => onChange(row.key, { androidAppId: v })}
                  placeholder="ca-app-pub-~"
                  autoCapitalize="none"
                  editable={!readOnly}
                  style={styles.cellInput}
                />
              </View>
              <View style={[styles.cell, { width: COL.appId }]}>
                <Input
                  value={row.iosAppId}
                  onChangeText={(v) => onChange(row.key, { iosAppId: v })}
                  placeholder="ca-app-pub-~"
                  autoCapitalize="none"
                  editable={!readOnly}
                  style={styles.cellInput}
                />
              </View>
              <View style={[styles.cell, { width: COL.unitId }]}>
                <Input
                  value={row.androidUnitId}
                  onChangeText={(v) => onChange(row.key, { androidUnitId: v })}
                  placeholder="ca-app-pub-/"
                  autoCapitalize="none"
                  editable={!readOnly}
                  style={styles.cellInput}
                />
              </View>
              <View style={[styles.cell, { width: COL.unitId }]}>
                <Input
                  value={row.iosUnitId}
                  onChangeText={(v) => onChange(row.key, { iosUnitId: v })}
                  placeholder="ca-app-pub-/"
                  autoCapitalize="none"
                  editable={!readOnly}
                  style={styles.cellInput}
                />
              </View>
            </View>
          ))}
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
    backgroundColor: THEME.surface,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: THEME.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingVertical: 10,
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.primary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderSoft,
    minHeight: 72,
  },
  dataRowAlt: { backgroundColor: THEME.bgSoft },
  typeCell: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderLeftWidth: 4,
    justifyContent: 'center',
  },
  typeLabel: { fontSize: 13, fontWeight: '800', color: THEME.text },
  typeSub: { fontSize: 10, color: THEME.textMuted, marginTop: 2 },
  cell: { paddingHorizontal: 6, paddingVertical: 8, justifyContent: 'center' },
  cellInput: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    marginBottom: 0,
  },
});
