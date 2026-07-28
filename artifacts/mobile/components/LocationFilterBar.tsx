import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
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

  const active =
    value.radiusKm || value.city || value.district
      ? [value.radiusKm ? `${value.radiusKm} km` : null, value.city, value.district].filter(Boolean).join(' · ')
      : null;

  const clear = () => onChange({});

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.toggle, { backgroundColor: colors.card, borderColor: active ? colors.primary : colors.border }]}
        onPress={() => setExpanded(!expanded)}
      >
        <Ionicons name="location-outline" size={16} color={colors.primary} />
        <Text style={[styles.toggleText, { color: colors.foreground }]} numberOfLines={1}>
          {active ?? 'Konum filtresi'}
        </Text>
        {active ? (
          <Pressable onPress={clear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        ) : (
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
        )}
      </Pressable>

      {expanded && (
        <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Mesafe</Text>
          <View style={styles.row}>
            {RADIUS_OPTIONS.map((km) => (
              <Pressable
                key={km}
                style={[
                  styles.chip,
                  { borderColor: colors.border },
                  value.radiusKm === km && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => onChange({ ...value, radiusKm: value.radiusKm === km ? undefined : km })}
              >
                <Text style={[styles.chipText, value.radiusKm === km && { color: '#FFF' }]}>{km} km</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Şehir</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {CITIES.map((city) => (
              <Pressable
                key={city}
                style={[
                  styles.chip,
                  { borderColor: colors.border },
                  value.city === city && { backgroundColor: colors.secondary, borderColor: colors.primary },
                ]}
                onPress={() => onChange({ ...value, city: value.city === city ? undefined : city, district: undefined })}
              >
                <Text style={[styles.chipText, { color: colors.foreground }]}>{city}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleText: { flex: 1, fontSize: 13, fontWeight: '600' },
  panel: { marginTop: 8, padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
});
