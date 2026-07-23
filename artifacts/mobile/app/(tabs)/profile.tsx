import React from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useMyListings } from '@/lib/hooks';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 32 - 16) / 3;

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const isWeb = Platform.OS === 'web';
  const paddingTop = isWeb ? 67 : insets.top + 20;

  const { data, isLoading } = useMyListings();
  const userListings = data?.pages.flatMap((p) => p.items) ?? [];

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
          rating: 0,
          totalSales: 0,
          isVerified: false,
        }
      : null);

  const handleLogout = async () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (!displayProfile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
    >
      <LinearGradient
        colors={[colors.primary, '#1A0A2E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop }]}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profil</Text>
          <Ionicons name="settings-outline" size={24} color="#FFF" />
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow} />
            <Image
              source={{ uri: displayProfile.avatar ?? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayProfile.name) }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.name}>{displayProfile.name}</Text>
          <View style={styles.badgesRow}>
            {displayProfile.isVerified && (
              <View style={styles.badgeGold}>
                <Text style={styles.badgeGoldText}>Güvenilir Satıcı</Text>
                <Ionicons name="checkmark-circle" size={12} color="#1A0A2E" />
              </View>
            )}
            <View style={styles.badgeWhite}>
              <Text style={[styles.badgeWhiteText, { color: colors.primary }]}>
                {displayProfile.totalSales}+ İşlem
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.statBoxValue, { color: colors.primary }]}>{userListings.length}</Text>
          <Text style={[styles.statBoxLabel, { color: colors.mutedForeground }]}>İlan</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.statBoxValue, { color: colors.primary }]}>{displayProfile.rating} ★</Text>
          <Text style={[styles.statBoxLabel, { color: colors.mutedForeground }]}>Puan</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.statBoxValue, { color: colors.primary }]}>
            {userListings.reduce((s, l) => s + l.views, 0)}
          </Text>
          <Text style={[styles.statBoxLabel, { color: colors.mutedForeground }]}>Görüntülenme</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>İlanlarım</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : userListings.length === 0 ? (
          <Text style={{ color: colors.mutedForeground }}>Henüz ilanınız yok</Text>
        ) : (
          <View style={styles.grid}>
            {userListings.map((item) => (
              <Pressable key={item.id} style={styles.gridItem} onPress={() => router.push(`/listing/${item.id}`)}>
                <Image source={{ uri: item.image }} style={styles.gridImage} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem icon="notifications-outline" title="Bildirimler" colors={colors} />
        <MenuItem icon="location-outline" title="Adreslerim" colors={colors} />
        <MenuItem icon="help-circle-outline" title="Yardım ve Destek" colors={colors} />
        <Pressable style={styles.menuItem} onPress={() => router.push('/privacy')}>
          <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
            <Ionicons name="shield-outline" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.menuTitle, { color: colors.foreground }]}>Gizlilik Politikası</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
        </Pressable>
        <Pressable style={styles.menuItem} onPress={handleLogout}>
          <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
            <Ionicons name="log-out-outline" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.menuTitle, { color: colors.primary }]}>Çıkış Yap</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function MenuItem({ icon, title, colors }: { icon: string; title: string; colors: any }) {
  return (
    <Pressable style={styles.menuItem}>
      <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.menuTitle, { color: colors.foreground }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  profileInfo: { alignItems: 'center' },
  avatarContainer: { position: 'relative', width: 100, height: 100, marginBottom: 16, justifyContent: 'center', alignItems: 'center' },
  avatarGlow: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(201,168,76,0.25)' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#C9A84C' },
  name: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  badgesRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  badgeGold: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C9A84C', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, gap: 4 },
  badgeGoldText: { fontSize: 10, fontWeight: '700', color: '#1A0A2E' },
  badgeWhite: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeWhiteText: { fontSize: 10, fontWeight: '700' },
  statsContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: -24 },
  statBox: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  statBoxValue: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  statBoxLabel: { fontSize: 12 },
  section: { padding: 16, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: 12, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  menuSection: { margin: 16, borderRadius: 20, paddingVertical: 8, borderWidth: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuTitle: { flex: 1, fontSize: 16, fontWeight: '500' },
});
