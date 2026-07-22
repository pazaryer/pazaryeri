import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useSearch } from '@/lib/hooks';
import { ListingCard } from '@/components/ListingCard';

const TRENDING = ['iPhone 14', 'PS5', 'Bisiklet', 'Nike', 'MacBook'];

const BENTO_CATEGORIES = [
  { name: 'Elektronik', icon: 'hardware-chip-outline', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&q=90', style: 'full', height: 160 },
  { name: 'Araç', icon: 'car-sport-outline', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=90', style: 'half', height: 140 },
  { name: 'Mobilya', icon: 'bed-outline', image: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&q=90', style: 'half', height: 140 },
  { name: 'Moda', icon: 'shirt-outline', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=90', style: 'half', height: 120 },
  { name: 'Spor', icon: 'bicycle-outline', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=90', style: 'half', height: 120 },
  { name: 'Ev', icon: 'home-outline', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=90', style: 'full', height: 110 },
];

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const paddingTop = isWeb ? 67 : insets.top + 20;

  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading: searching } = useSearch(searchQuery);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { paddingTop }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.primary} />
          <TextInput
            placeholder="Ne arıyorsunuz?"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {searchQuery.length >= 2 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Arama Sonuçları
          </Text>
          {searching ? (
            <ActivityIndicator color={colors.primary} />
          ) : searchResults?.items.length === 0 ? (
            <Text style={{ color: colors.mutedForeground }}>Sonuç bulunamadı</Text>
          ) : (
            <View style={styles.resultsGrid}>
              {searchResults?.items.map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>
      )}

      {searchQuery.length < 2 && (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trend Aramalar</Text>
            <View style={styles.chipContainer}>
              {TRENDING.map((trend) => (
                <Pressable
                  key={trend}
                  style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setSearchQuery(trend)}
                >
                  <Ionicons name="trending-up" size={14} color={colors.primary} />
                  <Text style={[styles.chipText, { color: colors.foreground }]}>{trend}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Kategoriler</Text>
            <View style={styles.bentoGrid}>
              {BENTO_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.name}
                  style={[styles.bentoCard, cat.style === 'full' ? styles.bentoFull : styles.bentoHalf, { height: cat.height }]}
                  onPress={() => setSearchQuery(cat.name)}
                >
                  <Image source={{ uri: cat.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                  <LinearGradient colors={['transparent', 'rgba(10,5,25,0.75)']} style={StyleSheet.absoluteFillObject} />
                  <View style={styles.bentoContent}>
                    <Ionicons name={cat.icon as any} size={36} color="#FFFFFF" />
                    <Text style={styles.bentoText}>{cat.name}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 52, borderRadius: 26, borderWidth: 1, gap: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, gap: 6 },
  chipText: { fontSize: 14, fontWeight: '500' },
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bentoCard: { borderRadius: 20, overflow: 'hidden' },
  bentoFull: { width: '100%' },
  bentoHalf: { width: '48%', flexGrow: 1 },
  bentoContent: { flex: 1, padding: 16, justifyContent: 'space-between', alignItems: 'flex-start' },
  bentoText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginTop: 'auto' },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
});
