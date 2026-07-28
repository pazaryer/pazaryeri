import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export type LocationFilterValue = {
  city?: string;
  district?: string;
  radiusKm?: number;
};

const RADIUS_OPTIONS = [5, 10, 20];
const CITIES = ['Antalya', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Adana'];

interface LocationFilterProps {
  value: LocationFilterValue;
  onChange: (v: LocationFilterValue) => void;
}

export function LocationFilterBar({ value, onChange }: LocationFilterProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const hasFilter = !!(value.radiusKm || value.city);
  const useEmoji = Platform.OS === 'web';

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <Pressable
            style={[
              styles.chip,
              { borderColor: colors.border, backgroundColor: colors.card },
              !hasFilter && { borderColor: colors.primary, backgroundColor: colors.secondary },
            ]}
            onPress={() => onChange({})}
          >
            {useEmoji ? (
              <Text style={styles.emoji}>🌍</Text>
            ) : (
              <Ionicons name="globe-outline" size={13} color={!hasFilter ? colors.primary : colors.mutedForeground} />
            )}
            <Text style={[styles.chipText, { color: !hasFilter ? colors.primary : colors.foreground }]}>Tümü</Text>
          </Pressable>
          {RADIUS_OPTIONS.map((km) => (
            <Pressable
              key={km}
              style={[
                styles.chip,
                { borderColor: colors.border, backgroundColor: colors.card },
                value.radiusKm === km && { borderColor: colors.primary, backgroundColor: colors.primary },
              ]}
              onPress={() => onChange({ ...value, radiusKm: value.radiusKm === km ? undefined : km, city: undefined })}
            >
              {useEmoji ? (
                <Text style={styles.emoji}>📍</Text>
              ) : (
                <Ionicons
                  name="navigate-outline"
                  size={13}
                  color={value.radiusKm === km ? '#FFF' : colors.mutedForeground}
                />
              )}
              <Text style={[styles.chipText, { color: value.radiusKm === km ? '#FFF' : colors.foreground }]}>
                {km} km
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.chip, styles.moreChip, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => setExpanded(!expanded)}
          >
            {useEmoji ? (
              <Text style={styles.emoji}>🏙️</Text>
            ) : (
              <Ionicons name="location" size={13} color={colors.primary} />
            )}
            <Text style={[styles.chipText, { color: colors.primary }]}>Şehir</Text>
            {useEmoji ? (
              <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
            ) : (
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={colors.mutedForeground} />
            )}
          </Pressable>
        </ScrollView>
        {hasFilter && (
          <Pressable onPress={() => onChange({})} hitSlop={8} style={styles.clearBtn}>
            {useEmoji ? (
              <Text style={styles.clearEmoji}>✕</Text>
            ) : (
              <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
            )}
          </Pressable>
        )}
      </View>

      {expanded && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityRow}>
          {CITIES.map((city) => (
            <Pressable
              key={city}
              style={[
                styles.cityChip,
                { borderColor: colors.border },
                value.city === city && { backgroundColor: colors.secondary, borderColor: colors.primary },
              ]}
              onPress={() => onChange({ city: value.city === city ? undefined : city, radiusKm: undefined })}
            >
              <Text style={[styles.cityText, { color: value.city === city ? colors.primary : colors.foreground }]}>
                {city}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10, gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  chipsRow: { gap: 6, paddingRight: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  moreChip: { paddingRight: 8 },
  emoji: { fontSize: 12 },
  chevron: { fontSize: 9, color: '#7A6B8A' },
  clearEmoji: { fontSize: 16, color: '#7A6B8A', fontWeight: '700' },
  chipText: { fontSize: 12, fontWeight: '600' },
  clearBtn: { paddingLeft: 4 },
  cityRow: { paddingHorizontal: 12, gap: 6 },
  cityChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  cityText: { fontSize: 12, fontWeight: '600' },
});
