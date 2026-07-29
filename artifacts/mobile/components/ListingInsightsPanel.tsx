import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useListingInsights, type ListingInsights } from '@/lib/hooks';
import { UserAvatar } from '@/components/UserAvatar';

function formatInsightDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

type Tab = 'favorites' | 'views';

type Props = {
  listingId: string;
  variant?: 'mobile' | 'web';
};

export function ListingInsightsPanel({ listingId, variant = 'mobile' }: Props) {
  const colors = useColors();
  const { data, isLoading } = useListingInsights(listingId, true);
  const [tab, setTab] = useState<Tab>('favorites');
  const isWeb = variant === 'web';

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={isWeb ? '#3D1A78' : colors.primary} />
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={[styles.panel, isWeb && styles.panelWeb]}>
      <Text style={[styles.title, isWeb && styles.titleWeb]}>İlan İstatistikleri</Text>
      <Text style={[styles.subtitle, isWeb && styles.subtitleWeb]}>
        {data.favoriteCount} favori · {data.viewCount} görüntülenme
      </Text>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'favorites' && styles.tabActive]}
          onPress={() => setTab('favorites')}
        >
          <Text style={[styles.tabText, tab === 'favorites' && styles.tabTextActive]}>
            Favorileyenler ({data.favoriters.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'views' && styles.tabActive]}
          onPress={() => setTab('views')}
        >
          <Text style={[styles.tabText, tab === 'views' && styles.tabTextActive]}>
            Görüntüleyenler ({data.viewers.length})
          </Text>
        </Pressable>
      </View>

      {tab === 'favorites' ? (
        <InsightList
          empty="Henüz kimse favorilemedi"
          items={data.favoriters.map((f) => ({
            key: f.userId,
            name: f.name,
            avatar: f.avatar,
            date: f.favoritedAt,
            icon: 'heart' as const,
          }))}
          isWeb={isWeb}
        />
      ) : (
        <InsightList
          empty="Henüz görüntülenme yok"
          items={data.viewers.map((v, i) => ({
            key: v.userId ?? `anon-${i}`,
            name: v.name,
            avatar: v.avatar,
            date: v.viewedAt,
            icon: v.isAnonymous ? ('person-outline' as const) : ('eye' as const),
          }))}
          isWeb={isWeb}
        />
      )}
    </View>
  );
}

function InsightList({
  items,
  empty,
  isWeb,
}: {
  items: Array<{ key: string; name: string; avatar: string | null; date: string; icon: 'heart' | 'eye' | 'person-outline' }>;
  empty: string;
  isWeb: boolean;
}) {
  if (!items.length) {
    return <Text style={[styles.empty, isWeb && styles.emptyWeb]}>{empty}</Text>;
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.key} style={[styles.row, isWeb && styles.rowWeb]}>
          {item.avatar ? (
            <UserAvatar name={item.name} avatar={item.avatar} size={40} />
          ) : (
            <View style={[styles.iconCircle, isWeb && styles.iconCircleWeb]}>
              <Ionicons name={item.icon} size={18} color="#3D1A78" />
            </View>
          )}
          <View style={styles.rowMeta}>
            <Text style={[styles.name, isWeb && styles.nameWeb]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.date, isWeb && styles.dateWeb]}>{formatInsightDate(item.date)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 24, alignItems: 'center' },
  panel: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E0F4',
    backgroundColor: '#FAF8FF',
  },
  panelWeb: { backgroundColor: '#FFFFFF' },
  title: { fontSize: 16, fontWeight: '700', color: '#1A0A2E' },
  titleWeb: { fontSize: 17 },
  subtitle: { fontSize: 12, color: '#7A6B8A', marginTop: 4, marginBottom: 12 },
  subtitleWeb: { fontSize: 13 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F0EBF8',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#3D1A78' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#5C4D6E' },
  tabTextActive: { color: '#FFFFFF' },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#3D1A78', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
      default: {},
    }),
  },
  rowWeb: { borderWidth: 1, borderColor: '#F0EBF8' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F5FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleWeb: { backgroundColor: '#FAF8FF' },
  rowMeta: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#1A0A2E' },
  nameWeb: { fontSize: 14 },
  date: { fontSize: 11, color: '#9D8BB5', marginTop: 2 },
  dateWeb: { fontSize: 12 },
  empty: { fontSize: 13, color: '#9D8BB5', textAlign: 'center', paddingVertical: 16 },
  emptyWeb: { fontSize: 14 },
});
