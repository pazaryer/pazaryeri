import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Btn, Input } from '@/components/ui';
import { THEME, SPACING, RADIUS } from '@/lib/theme';

export type SponsorRow = {
  placement: string;
  label: string;
  enabled: boolean;
  imageUrl: string;
  linkUrl: string;
  altText: string;
};

type Props = {
  rows: SponsorRow[];
  onChange: (placement: string, patch: Partial<SponsorRow>) => void;
  onUpload: (placement: string) => void;
  uploadingPlacement: string | null;
  readOnly?: boolean;
};

export function SponsorBannerTable({
  rows,
  onChange,
  onUpload,
  uploadingPlacement,
  readOnly,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={[styles.th, styles.colPage]}>Sayfa</Text>
        <Text style={[styles.th, styles.colOn]}>Açık</Text>
        <Text style={[styles.th, styles.colPreview]}>Önizleme</Text>
        <Text style={[styles.th, styles.colAction]}>İşlem</Text>
      </View>
      {rows.map((row, idx) => {
        const open = expanded === row.placement;
        const uploading = uploadingPlacement === row.placement;
        return (
          <View key={row.placement}>
            <Pressable
              onPress={() => setExpanded(open ? null : row.placement)}
              style={[styles.dataRow, idx % 2 === 1 && styles.dataRowAlt]}
            >
              <View style={styles.colPage}>
                <Text style={styles.pageLabel}>{row.label}</Text>
              </View>
              <View style={styles.colOn}>
                <Switch
                  value={row.enabled}
                  onValueChange={(v) => onChange(row.placement, { enabled: v })}
                  disabled={readOnly}
                  trackColor={{ true: THEME.primary, false: THEME.border }}
                  thumbColor="#FFF"
                />
              </View>
              <View style={styles.colPreview}>
                {row.imageUrl ? (
                  <Image source={{ uri: row.imageUrl }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={styles.thumbEmpty}>
                    <Text style={styles.thumbEmptyText}>—</Text>
                  </View>
                )}
              </View>
              <View style={styles.colAction}>
                <Text style={styles.editLink}>{open ? 'Kapat ▴' : 'Düzenle ▾'}</Text>
              </View>
            </Pressable>
            {open ? (
              <View style={styles.expand}>
                <Text style={styles.fieldLabel}>Tıklama linki</Text>
                <Input
                  value={row.linkUrl}
                  onChangeText={(v) => onChange(row.placement, { linkUrl: v })}
                  placeholder="https://..."
                  autoCapitalize="none"
                  editable={!readOnly}
                />
                <Text style={styles.fieldLabel}>Görsel URL</Text>
                <Input
                  value={row.imageUrl}
                  onChangeText={(v) => onChange(row.placement, { imageUrl: v })}
                  placeholder="https://..."
                  autoCapitalize="none"
                  editable={!readOnly}
                />
                <View style={styles.btnRow}>
                  <Btn
                    label={uploading ? 'Yükleniyor…' : 'Galeriden yükle'}
                    variant="ghost"
                    compact
                    onPress={() => onUpload(row.placement)}
                    disabled={readOnly || uploadingPlacement !== null}
                  />
                  {row.imageUrl ? (
                    <Btn
                      label="Görseli kaldır"
                      variant="danger"
                      compact
                      onPress={() => onChange(row.placement, { imageUrl: '' })}
                      disabled={readOnly}
                    />
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
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
    alignItems: 'center',
    backgroundColor: THEME.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.primary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  colPage: { flex: 1.2 },
  colOn: { width: 64, textAlign: 'center' },
  colPreview: { width: 88, textAlign: 'center' },
  colAction: { width: 88, textAlign: 'right' },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderSoft,
  },
  dataRowAlt: { backgroundColor: THEME.bgSoft },
  pageLabel: { fontSize: 14, fontWeight: '700', color: THEME.text },
  thumb: { width: 72, height: 22, borderRadius: 4, borderWidth: 1, borderColor: THEME.border },
  thumbEmpty: {
    width: 72,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgSoft,
  },
  thumbEmptyText: { fontSize: 10, color: THEME.textMuted },
  editLink: { fontSize: 12, fontWeight: '700', color: THEME.primary, textAlign: 'right' },
  expand: {
    padding: SPACING.md,
    backgroundColor: THEME.bgSoft,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderSoft,
    gap: 4,
  },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: THEME.textSoft, marginTop: 6, marginBottom: 4 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
});
