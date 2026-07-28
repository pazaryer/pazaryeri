import React, { useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, useMyListings, type ListingSummary } from '@/lib/hooks';

const { width } = Dimensions.get('window');
const LISTING_CARD_WIDTH = width * 0.42;

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const isWeb = Platform.OS === 'web';
  const paddingTop = isWeb ? 67 : insets.top + 8;

  const { data, isLoading, refetch, isRefetching } = useMyListings();
  const userListings = data?.pages.flatMap((p) => p.items) ?? [];
  const totalViews = userListings.reduce((s, l) => s + l.views, 0);
  const activeCount = userListings.filter((l) => l.status === 'active').length;

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
  const memberSince = displayProfile.createdAt
    ? new Date(displayProfile.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#3D1A78', '#2A1254', '#1A0A2E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop }]}
      >
        <View style={styles.heroTop}>
          <Text style={styles.heroEyebrow}>Hesabım</Text>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
            hitSlop={12}
            accessibilityLabel="Ayarlar"
          >
            <Ionicons name="settings-outline" size={22} color="#FFF" />
          </Pressable>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#C9A84C', '#E8D5A0', '#C9A84C']} style={styles.avatarRing}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
            </LinearGradient>
            {displayProfile.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#1A0A2E" />
              </View>
            )}
          </View>

          <View style={styles.profileMeta}>
            <Text style={styles.name} numberOfLines={2}>
              {displayProfile.name}
            </Text>
            {displayProfile.email ? (
              <Text style={styles.email} numberOfLines={1}>
                {displayProfile.email}
              </Text>
            ) : null}
            {locationLabel ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.75)" />
                <Text style={styles.locationText}>{locationLabel}</Text>
              </View>
            ) : null}
            {memberSince ? (
              <Text style={styles.memberSince}>Üye: {memberSince}</Text>
            ) : null}
          </View>
        </View>

        {displayProfile.bio ? (
          <Text style={styles.bio} numberOfLines={3}>
            {displayProfile.bio}
          </Text>
        ) : null}

        <View style={styles.quickActions}>
          <QuickAction
            icon="add-circle"
            label="İlan Ver"
            onPress={() => router.push('/(tabs)/post')}
            primary
          />
          <QuickAction
            icon="create-outline"
            label="Düzenle"
            onPress={() => router.push('/settings')}
          />
          <QuickAction
            icon="chatbubbles-outline"
            label="Mesajlar"
            onPress={() => router.push('/(tabs)/messages')}
          />
        </View>
      </LinearGradient>

      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <StatItem icon="grid-outline" value={String(userListings.length)} label="İlan" colors={colors} />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem icon="eye-outline" value={String(totalViews)} label="Görüntülenme" colors={colors} />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem
          icon="star"
          value={displayProfile.rating > 0 ? displayProfile.rating.toFixed(1) : '—'}
          label="Puan"
          colors={colors}
        />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem icon="bag-check-outline" value={String(displayProfile.totalSales)} label="Satış" colors={colors} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>İlanlarım</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              {activeCount} aktif · {userListings.length} toplam
            </Text>
          </View>
          {userListings.length > 0 && (
            <Pressable onPress={() => router.push('/(tabs)/post')}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>+ Yeni</Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />
        ) : userListings.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="storefront-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz ilanınız yok</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              İlk ilanınızı verin, binlerce alıcıya ulaşın
            </Text>
            <Pressable
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/post')}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.emptyBtnText}>İlan Ver</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listingsRow}
          >
            {userListings.map((item) => (
              <ProfileListingCard key={item.id} item={item} colors={colors} />
            ))}
          </ScrollView>
        )}
      </View>

      <MenuGroup title="Hesap" colors={colors}>
        <MenuRow icon="notifications-outline" title="Bildirimler" subtitle="Tercihlerinizi yönetin" colors={colors} onPress={() => router.push('/notifications')} />
        <MenuRow icon="location-outline" title="Adreslerim" subtitle="Şehir ve ilçe bilgisi" colors={colors} onPress={() => router.push('/addresses')} />
        <MenuRow icon="settings-outline" title="Profil Ayarları" subtitle="Ad, bio ve hesap" colors={colors} onPress={() => router.push('/settings')} />
      </MenuGroup>

      <MenuGroup title="Destek" colors={colors}>
        <MenuRow icon="help-circle-outline" title="Yardım ve Destek" subtitle="SSS ve iletişim" colors={colors} onPress={() => router.push('/help')} />
        <MenuRow icon="shield-outline" title="Gizlilik Politikası" colors={colors} onPress={() => router.push('/privacy')} />
        <MenuRow icon="document-text-outline" title="Kullanım Şartları" colors={colors} onPress={() => router.push('/terms')} />
      </MenuGroup>

      <Pressable style={[styles.logoutBtn, { borderColor: colors.border }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Çıkış Yap</Text>
      </Pressable>
    </ScrollView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  primary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      style={[styles.quickAction, primary && styles.quickActionPrimary]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={primary ? '#1A0A2E' : '#FFF'} />
      <Text style={[styles.quickActionText, primary && styles.quickActionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

function StatItem({
  icon,
  value,
  label,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function ProfileListingCard({
  item,
  colors,
}: {
  item: ListingSummary;
  colors: ReturnType<typeof useColors>;
}) {
  const router = useRouter();
  const statusStyle =
    item.status === 'sold'
      ? styles.statusSold
      : item.status === 'active'
        ? styles.statusActive
        : styles.statusOther;

  return (
    <Pressable
      style={[styles.listingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/listing/${item.id}`)}
    >
      <View style={styles.listingImageWrap}>
        <Image source={{ uri: item.image }} style={styles.listingImage} contentFit="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={styles.listingGradient} />
        <View style={[styles.statusPill, statusStyle]}>
          <Text style={styles.statusText}>
            {item.status === 'active' ? 'Yayında' : item.status === 'sold' ? 'Satıldı' : item.status}
          </Text>
        </View>
      </View>
      <View style={styles.listingBody}>
        <Text style={[styles.listingPrice, { color: colors.primary }]}>{formatPrice(item.price)}</Text>
        <Text style={[styles.listingTitle, { color: colors.foreground }]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.listingMeta}>
          <Ionicons name="eye-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.listingMetaText, { color: colors.mutedForeground }]}>{item.views}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function MenuGroup({
  title,
  colors,
  children,
}: {
  title: string;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.menuGroup}>
      <Text style={[styles.menuGroupTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  colors,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={[styles.menuTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroEyebrow: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)', letterSpacing: 1 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  avatarRing: { padding: 3, borderRadius: 44 },
  avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#2A1254' },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1A0A2E',
  },
  profileMeta: { flex: 1, gap: 3 },
  name: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  memberSince: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  bio: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.8)',
  },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  quickActionPrimary: { backgroundColor: '#C9A84C', borderColor: '#C9A84C' },
  quickActionText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  quickActionTextPrimary: { color: '#1A0A2E' },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -18,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    shadowColor: '#3D1A78',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  statDivider: { width: 1, alignSelf: 'stretch', marginVertical: 4 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  sectionSub: { fontSize: 13, marginTop: 2 },
  sectionLink: { fontSize: 14, fontWeight: '700' },
  listingsRow: { gap: 12, paddingRight: 8 },
  listingCard: {
    width: LISTING_CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  listingImageWrap: { height: 130, position: 'relative' },
  listingImage: { width: '100%', height: '100%' },
  listingGradient: { ...StyleSheet.absoluteFillObject },
  statusPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusActive: { backgroundColor: 'rgba(46, 125, 50, 0.9)' },
  statusSold: { backgroundColor: 'rgba(198, 40, 40, 0.9)' },
  statusOther: { backgroundColor: 'rgba(0,0,0,0.55)' },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  listingBody: { padding: 12, gap: 4 },
  listingPrice: { fontSize: 16, fontWeight: '800' },
  listingTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  listingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  listingMetaText: { fontSize: 11 },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  menuGroup: { marginTop: 20, paddingHorizontal: 16 },
  menuGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600' },
  menuSub: { fontSize: 12, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
});
