import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { buildLocationFilterFromInputs } from '@/lib/location-storage';
import { filterIller, normalizeIl } from '@/lib/turkiye-iller';
import { useDistrictSuggestions, useNeighborhoodSuggestions } from '@/lib/hooks';

export type LocationFilterValue = {
  city?: string;
  district?: string;
  neighborhood?: string;
  radiusKm?: number;
};

const RADIUS_OPTIONS = [5, 10, 20];

interface LocationFilterProps {
  value: LocationFilterValue;
  onChange: (v: LocationFilterValue) => void;
}

export type LocationFilterBarHandle = {
  commitPending: () => LocationFilterValue;
};

export const LocationFilterBar = forwardRef<LocationFilterBarHandle, LocationFilterProps>(function LocationFilterBar(
  { value, onChange },
  ref,
) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [cityQuery, setCityQuery] = useState(value.city ?? '');
  const [districtQuery, setDistrictQuery] = useState(value.district ?? '');
  const [neighborhoodQuery, setNeighborhoodQuery] = useState(value.neighborhood ?? '');
  const hasFilter = !!(value.radiusKm || value.city || value.district || value.neighborhood);
  const useEmoji = Platform.OS === 'web';
  const citySuggestions = useMemo(() => filterIller(cityQuery, 8), [cityQuery]);
  const activeCity = normalizeIl(value.city ?? cityQuery) ?? value.city;
  const { data: districtData } = useDistrictSuggestions(activeCity ?? '', districtQuery);
  const { data: neighborhoodData } = useNeighborhoodSuggestions(
    activeCity ?? '',
    value.district ?? districtQuery,
    neighborhoodQuery,
  );
  const districtSuggestions = districtData?.items ?? [];
  const neighborhoodSuggestions = neighborhoodData?.items ?? [];

  useEffect(() => {
    setCityQuery(value.city ?? '');
    setDistrictQuery(value.district ?? '');
    setNeighborhoodQuery(value.neighborhood ?? '');
  }, [value.city, value.district, value.neighborhood]);

  useImperativeHandle(
    ref,
    () => ({
      commitPending: () =>
        buildLocationFilterFromInputs(value, {
          cityQuery,
          districtQuery,
          neighborhoodQuery,
        }),
    }),
    [value, cityQuery, districtQuery, neighborhoodQuery],
  );

  const handleCityQueryChange = (text: string) => {
    const prevNorm = normalizeIl(value.city ?? cityQuery);
    const nextNorm = normalizeIl(text);
    setCityQuery(text);
    if (!text.trim() || (prevNorm && nextNorm && prevNorm !== nextNorm)) {
      setDistrictQuery('');
      setNeighborhoodQuery('');
    }
  };

  const clearLocalQueries = () => {
    setCityQuery('');
    setDistrictQuery('');
    setNeighborhoodQuery('');
  };

  const pickCity = (city: string) => {
    setCityQuery(city);
    setDistrictQuery('');
    setNeighborhoodQuery('');
    onChange({ city, district: undefined, neighborhood: undefined, radiusKm: undefined });
  };

  const clearFilter = () => {
    clearLocalQueries();
    onChange({});
  };

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
            onPress={clearFilter}
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
              onPress={() => {
                if (value.radiusKm === km) {
                  clearFilter();
                } else {
                  clearLocalQueries();
                  onChange({ radiusKm: km });
                }
              }}
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
            <Text style={[styles.chipText, { color: colors.primary }]}>Şehir / İlçe</Text>
            {useEmoji ? (
              <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
            ) : (
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={colors.mutedForeground} />
            )}
          </Pressable>
        </ScrollView>
        {hasFilter && (
          <Pressable onPress={clearFilter} hitSlop={8} style={styles.clearBtn}>
            {useEmoji ? (
              <Text style={styles.clearEmoji}>✕</Text>
            ) : (
              <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
            )}
          </Pressable>
        )}
      </View>

      {expanded && (
        <View style={styles.cityPanel}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>İl / Şehir</Text>
          <TextInput
            style={[styles.fieldInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
            placeholder="Örn. İstanbul, Antalya..."
            placeholderTextColor={colors.mutedForeground}
            value={cityQuery}
            onChangeText={handleCityQueryChange}
            onSubmitEditing={() => {
              const city = normalizeIl(cityQuery);
              if (city) {
                setDistrictQuery('');
                setNeighborhoodQuery('');
                onChange({ city, district: undefined, neighborhood: undefined, radiusKm: undefined });
              }
            }}
          />
          {citySuggestions.length > 0 && cityQuery.length > 0 && (
            <View style={[styles.suggestions, { borderColor: colors.border, backgroundColor: colors.card }]}>
              {citySuggestions.map((city) => (
                <Pressable key={city} style={styles.suggestionRow} onPress={() => pickCity(city)}>
                  <Text style={[styles.suggestionText, { color: colors.foreground }]}>{city}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 10 }]}>İlçe</Text>
          <TextInput
            style={[styles.fieldInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
            placeholder={activeCity ? 'Örn. Kadıköy, Muratpaşa...' : 'Önce il seçin'}
            placeholderTextColor={colors.mutedForeground}
            value={districtQuery}
            editable={!!activeCity}
            onChangeText={setDistrictQuery}
            onSubmitEditing={() => {
              if (!districtQuery.trim() || !activeCity) return;
              setNeighborhoodQuery('');
              onChange({
                city: activeCity,
                district: districtQuery.trim(),
                neighborhood: undefined,
                radiusKm: undefined,
              });
            }}
          />
          {districtSuggestions.length > 0 && districtQuery.length > 0 && (
            <View style={[styles.suggestions, { borderColor: colors.border, backgroundColor: colors.card }]}>
              {districtSuggestions.map((district) => (
                <Pressable
                  key={district}
                  style={styles.suggestionRow}
                  onPress={() => {
                    setDistrictQuery(district);
                    setNeighborhoodQuery('');
                    onChange({
                      city: activeCity,
                      district,
                      neighborhood: undefined,
                      radiusKm: undefined,
                    });
                  }}
                >
                  <Text style={[styles.suggestionText, { color: colors.foreground }]}>{district}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 10 }]}>Mahalle</Text>
          <TextInput
            style={[styles.fieldInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
            placeholder={value.district || districtQuery ? 'Mahalle ara...' : 'Önce ilçe seçin'}
            placeholderTextColor={colors.mutedForeground}
            value={neighborhoodQuery}
            editable={!!(value.district || districtQuery)}
            onChangeText={setNeighborhoodQuery}
          />
          {neighborhoodSuggestions.length > 0 && neighborhoodQuery.length > 0 && (
            <View style={[styles.suggestions, { borderColor: colors.border, backgroundColor: colors.card }]}>
              {neighborhoodSuggestions.slice(0, 12).map((mahalle) => (
                <Pressable
                  key={mahalle}
                  style={styles.suggestionRow}
                  onPress={() => {
                    const district = districtQuery.trim() || value.district;
                    if (!activeCity || !district) return;
                    setNeighborhoodQuery(mahalle);
                    onChange({
                      city: activeCity,
                      district,
                      neighborhood: mahalle,
                      radiusKm: undefined,
                    });
                  }}
                >
                  <Text style={[styles.suggestionText, { color: colors.foreground }]}>{mahalle}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              onChange(
                buildLocationFilterFromInputs(value, {
                  cityQuery,
                  districtQuery,
                  neighborhoodQuery,
                }),
              );
              setExpanded(false);
            }}
          >
            <Text style={styles.applyText}>Uygula</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});

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
  cityPanel: { paddingHorizontal: 12, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  fieldInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  suggestions: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  suggestionRow: { paddingHorizontal: 12, paddingVertical: 10 },
  suggestionText: { fontSize: 14, fontWeight: '600' },
  applyBtn: { marginTop: 8, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  applyText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
