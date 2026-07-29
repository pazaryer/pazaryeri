import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, useMyListings, useUpdateProfile, type ListingSummary } from '@/lib/hooks';
import { pickImages } from '@/lib/storage';
import { formatPhoneDisplay } from '@/lib/contact';
import { BRAND } from '@/constants/brand';

const { width } = Dimensions.get('window');
const LISTING_CARD_WIDTH = width * 0.36;

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, user, signOut, refreshProfile, patchProfile } = useAuth();
  const isWeb = Platform.OS === 'web';
  const paddingTop = isWeb ? 67 : insets.top + 12;
  const updateProfile = useUpdateProfile();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useMyListings();
  const userListings = data?.pages.flatMap((p) => p.items) ?? [];
  const totalViews = userListings.reduce((s, l) => s + l.views, 0);

  React.useEffect(() => {
    if (user && !profile) refreshProfile();
  }, [user, profile, refreshProfile]);

  const displayProfile =
    profile ??
    (user
      ? {
          id: user.uid,
          name: user.displayName ?? 'Kullanıcı',
          email: user.email,
          phone: null,
          avatar: user.photoURL,
          bio: null,
          city: null,
          district: null,
          rating: 0,
          totalSales: 0,
          isVerified: false,
          createdAt: new Date().toISOString(),
        }
      : null);

  const onRefresh = useCallback(() => {
    refetch();
    refreshProfile();
  }, [refetch, refreshProfile]);

  const handleAvatarPress = async () => {
    try {
      setUploadingAvatar(true);
      const urls = await pickImages(1);
      if (!urls[0]) return;
      const saved = await updateProfile.mutateAsync({ avatar: urls[0] });
      patchProfile({ avatar: saved.avatar ?? urls[0] });
      Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi');
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Fotoğraf yüklenemedi');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (!displayProfile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const avatarUri =
    displayProfile.avatar ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayProfile.name)}&background=3D1A78&color=fff&size=200`;
  const locationLabel = [displayProfile.district, displayProfile.city].filter(Boolean).join(', ');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { paddingTop, backgroundColor: '#FFFFFF', borderBottomColor: colors.border }]}>
        <View style={styles.heroTop}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Profilim</Text>
          <Pressable style={[styles.iconBtn, { backgroundColor: colors.muted }]} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.profileCenter}>
          <Pressable onPress={handleAvatarPress} style={styles.avatarBtn}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
            <View style={styles.cameraBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#1A0A2E" />
              ) : (
                <Ionicons name="camera" size={14} color="#FFF" />
              )}
            </View>
          </Pressable>
          <Text style={styles.name}>{displayProfile.name}</Text>
          {locationLabel ? (
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={13} color="#717171" />
              <Text style={styles.locText}>{locationLabel}</Text>
            </View>
          ) : null}
          {displayProfile.phone ? (
            <Text style={styles.phoneText}>{formatPhoneDisplay(displayProfile.phone)}</Text>
          ) : null}
          {displayProfile.bio ? (
            <Text style={styles.bio} numberOfLines={2}>{displayProfile.bio}</Text>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <StatPill value={String(userListings.length)} label="İlan" />
          <StatPill value={String(totalViews)} label="Görüntülenme" />
          <StatPill value={displayProfile.rating > 0 ? displayProfile.rating.toFixed(1) : '—'} label="Puan" />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <ActionBtn icon="add-circle" label="İlan Ver" primary onPress={() => router.push('/(tabs)/post')} colors={colors} />
        <ActionBtn icon="chatbubbles-outline" label="Mesajlar" onPress={() => router.push('/(tabs)/messages')} colors={colors} />
        <ActionBtn icon="notifications-outline" label="Bildirimler" onPress={() => router.push('/notifications')} colors={colors} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>İlanlarım</Text>
          <Pressable onPress={() => router.push('/(tabs)/post')}>
            <Text style={[styles.sectionLink, { color: colors.primary }]}>+ Yeni</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : userListings.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="storefront-outline" size={36} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz ilan yok</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>İlk ilanınızı verin</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listingsRow}>
            {userListings.map((item) => (
              <ProfileListingCard key={item.id} item={item} colors={colors} />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem icon="heart-outline" title="Favorilerim" onPress={() => router.push('/favorites')} colors={colors} />
        <MenuItem icon="settings-outline" title="Profil Ayarları" onPress={() => router.push('/settings')} colors={colors} />
        <MenuItem icon="help-circle-outline" title="Yardım" onPress={() => router.push('/help')} colors={colors} />
        <MenuItem icon="log-out-outline" title="Çıkış Yap" destructive onPress={handleLogout} colors={colors} last />
      </View>
    </ScrollView>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
  primary,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      style={[
        styles.actionBtn,
        { backgroundColor: primary ? colors.primary : colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={primary ? '#FFF' : colors.primary} />
      <Text style={[styles.actionLabel, { color: primary ? '#FFF' : colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

function ProfileListingCard({ item, colors }: { item: ListingSummary; colors: ReturnType<typeof useColors> }) {
  const router = useRouter();
  return (
    <Pressable
      style={[styles.listingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/listing/${item.id}`)}
    >
      <Image source={{ uri: item.image }} style={styles.listingImage} contentFit="cover" />
      <View style={styles.listingBody}>
        <Text style={[styles.listingPrice, { color: colors.primary }]}>{formatPrice(item.price)}</Text>
        <Text style={[styles.listingTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
      </View>
    </Pressable>
  );
}

function MenuItem({
  icon,
  title,
  onPress,
  colors,
  destructive,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  destructive?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      style={[styles.menuItem, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={destructive ? colors.destructive : colors.primary} />
      <Text style={[styles.menuTitle, { color: destructive ? colors.destructive : colors.foreground }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 18, fontWeight: '700' },
  iconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  profileCenter: { alignItems: 'center', gap: 6 },
  avatarBtn: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: BRAND.primary },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: { fontSize: 22, fontWeight: '800', color: '#2C2C2C', marginTop: 8 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: 13, color: '#717171' },
  phoneText: { fontSize: 13, color: '#9E9E9E' },
  bio: { fontSize: 13, color: '#717171', textAlign: 'center', paddingHorizontal: 20, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 20 },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F4F4F4',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#2C2C2C' },
  statLabel: { fontSize: 11, color: '#717171', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 11, fontWeight: '700' },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionLink: { fontSize: 14, fontWeight: '700' },
  listingsRow: { gap: 10 },
  listingCard: { width: LISTING_CARD_WIDTH, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  listingImage: { width: '100%', height: 100 },
  listingBody: { padding: 10, gap: 4 },
  listingPrice: { fontSize: 15, fontWeight: '800' },
  listingTitle: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  emptyCard: { alignItems: 'center', padding: 28, borderRadius: 16, borderWidth: 1, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13 },
  menuCard: { marginHorizontal: 16, marginTop: 20, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
});
