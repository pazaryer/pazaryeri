import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface ListingMapPinProps {
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  city?: string | null;
  district?: string | null;
}

export function ListingMapPin({ latitude, longitude, title, city, district }: ListingMapPinProps) {
  const colors = useColors();
  const hasCoords = latitude != null && longitude != null;
  const label = [district, city].filter(Boolean).join(', ') || 'Konum';

  const openMaps = () => {
    if (!hasCoords) return;
    const q = encodeURIComponent(`${latitude},${longitude}`);
    const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${q}`
        : Platform.OS === 'android'
          ? `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(title ?? 'İlan')})`
          : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    void Linking.openURL(url);
  };

  if (!hasCoords && !city) return null;

  if (Platform.OS === 'web' && hasCoords) {
    const bbox = `${longitude! - 0.01},${latitude! - 0.008},${longitude! + 0.01},${latitude! + 0.008}`;
    const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
    return (
      <View style={styles.wrap}>
        <Text style={[styles.title, { color: colors.foreground }]}>Konum</Text>
        <View style={[styles.mapFrame, { borderColor: colors.border }]}>
          {React.createElement('iframe', {
            title: 'Harita',
            src: embed,
            style: { width: '100%', height: 180, border: 0, borderRadius: 12 },
            loading: 'lazy',
          })}
        </View>
        <Pressable onPress={openMaps} style={styles.linkRow}>
          <Ionicons name="navigate-outline" size={16} color={colors.primary} />
          <Text style={[styles.linkText, { color: colors.primary }]}>{label} — Haritada aç</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.foreground }]}>Konum</Text>
      <Pressable
        style={[styles.pinCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={hasCoords ? openMaps : undefined}
        disabled={!hasCoords}
      >
        <View style={[styles.pinIcon, { backgroundColor: colors.secondary }]}>
          <Ionicons name="location" size={22} color={colors.primary} />
        </View>
        <View style={styles.pinText}>
          <Text style={[styles.pinLabel, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.pinHint, { color: colors.mutedForeground }]}>
            {hasCoords ? 'Haritada görmek için dokunun' : 'Koordinat bilgisi yok'}
          </Text>
        </View>
        {hasCoords && <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />}
      </Pressable>
      {hasCoords && (
        <View style={[styles.staticMap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
          <Text style={[styles.staticMapText, { color: colors.mutedForeground }]}>
            📍 {latitude!.toFixed(4)}, {longitude!.toFixed(4)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  mapFrame: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { fontSize: 13, fontWeight: '600' },
  pinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  pinIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pinText: { flex: 1 },
  pinLabel: { fontSize: 15, fontWeight: '700' },
  pinHint: { fontSize: 12, marginTop: 2 },
  staticMap: { padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  staticMapText: { fontSize: 12, fontWeight: '600' },
});
