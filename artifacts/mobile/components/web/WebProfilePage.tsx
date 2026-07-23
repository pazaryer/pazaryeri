import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { WebShell } from './WebShell';
import { WebPage } from './WebPage';
import { useAuth } from '@/contexts/AuthContext';
import { useMyListings, useUpdateProfile, formatPrice } from '@/lib/hooks';
import { showAlert, showConfirm } from '@/lib/web-alert';

export function WebProfilePage() {
  const router = useRouter();
  const { profile, user, signOut, refreshProfile, patchProfile, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useMyListings();
  const updateProfile = useUpdateProfile();
  const userListings = data?.pages.flatMap((p) => p.items) ?? [];

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (user && !profile) refreshProfile();
  }, [user, profile, refreshProfile]);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/giris');
    }
  }, [user, authLoading, router]);

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
          rating: 0,
          totalSales: 0,
          isVerified: false,
        }
      : null);

  const startEdit = () => {
    if (!displayProfile) return;
    setEditName(displayProfile.name);
    setEditCity(displayProfile.city ?? '');
    setEditBio(displayProfile.bio ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) return showAlert('Hata', 'İsim gerekli');
    setSaving(true);
    try {
      const saved = await updateProfile.mutateAsync({
        name: editName.trim(),
        city: editCity.trim() || undefined,
        bio: editBio.trim() || undefined,
      });
      if (saved && typeof saved === 'object' && 'name' in saved) {
        patchProfile({
          name: saved.name as string,
          city: (saved.city as string) || null,
          bio: (saved.bio as string) || null,
        });
      } else {
        patchProfile({
          name: editName.trim(),
          city: editCity.trim() || null,
          bio: editBio.trim() || null,
        });
      }
      setEditing(false);
      showAlert('Başarılı', 'Profiliniz güncellendi');
    } catch (e: any) {
      showAlert('Hata', e.message ?? 'Profil güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    showConfirm('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', async () => {
      await signOut();
      router.replace('/');
    });
  };

  if (authLoading || !displayProfile) {
    return (
      <WebShell hideFooter>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3D1A78" />
        </View>
      </WebShell>
    );
  }

  const totalViews = userListings.reduce((s, l) => s + l.views, 0);

  return (
    <WebShell hideFooter>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <WebPage title="Hesabım">
          <View style={styles.layout}>
            <View style={styles.sidebar}>
              <View style={styles.profileCard}>
                <Image
                  source={{
                    uri:
                      displayProfile.avatar ??
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayProfile.name)}&background=3D1A78&color=fff`,
                  }}
                  style={styles.avatar}
                />
                {editing ? (
                  <View style={styles.editForm}>
                    <Text style={styles.editLabel}>Ad Soyad</Text>
                    <TextInput style={styles.editInput} value={editName} onChangeText={setEditName} />
                    <Text style={styles.editLabel}>Şehir</Text>
                    <TextInput style={styles.editInput} value={editCity} onChangeText={setEditCity} placeholder="İstanbul" placeholderTextColor="#9D8BB5" />
                    <Text style={styles.editLabel}>Hakkımda</Text>
                    <TextInput
                      style={[styles.editInput, styles.editBio]}
                      value={editBio}
                      onChangeText={setEditBio}
                      multiline
                      placeholder="Kendinizi tanıtın..."
                      placeholderTextColor="#9D8BB5"
                    />
                    <View style={styles.editActions}>
                      <Pressable style={styles.cancelBtn} onPress={() => setEditing(false)}>
                        <Text style={styles.cancelBtnText}>İptal</Text>
                      </Pressable>
                      <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                        {saving ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={styles.saveBtnText}>Kaydet</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.name}>{displayProfile.name}</Text>
                    {displayProfile.email && <Text style={styles.email}>{displayProfile.email}</Text>}
                    {displayProfile.city && <Text style={styles.city}>📍 {displayProfile.city}</Text>}
                    {displayProfile.bio && <Text style={styles.bio}>{displayProfile.bio}</Text>}
                    {displayProfile.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedIcon}>✓</Text>
                        <Text style={styles.verifiedText}>Güvenilir Satıcı</Text>
                      </View>
                    )}
                    <Pressable style={styles.editBtn} onPress={startEdit}>
                      <Text style={styles.editBtnText}>✏️ Profili Düzenle</Text>
                    </Pressable>
                  </>
                )}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{userListings.length}</Text>
                  <Text style={styles.statLabel}>İlan</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{displayProfile.rating} ★</Text>
                  <Text style={styles.statLabel}>Puan</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{totalViews}</Text>
                  <Text style={styles.statLabel}>Görüntülenme</Text>
                </View>
              </View>

              <View style={styles.menu}>
                <Pressable style={styles.menuItem} onPress={() => router.push('/ilan-ver')}>
                  <Text style={styles.menuIcon}>➕</Text>
                  <Text style={styles.menuText}>Yeni İlan Ver</Text>
                </Pressable>
                <Pressable style={styles.menuItem} onPress={() => router.push('/mesajlar')}>
                  <Text style={styles.menuIcon}>💬</Text>
                  <Text style={styles.menuText}>Mesajlarım</Text>
                </Pressable>
                <Pressable style={[styles.menuItem, styles.menuDanger]} onPress={handleLogout}>
                  <Text style={styles.menuIcon}>🚪</Text>
                  <Text style={[styles.menuText, { color: '#C0392B' }]}>Çıkış Yap</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.main}>
              <View style={styles.mainHeader}>
                <Text style={styles.mainTitle}>İlanlarım</Text>
                <Pressable style={styles.addBtn} onPress={() => router.push('/ilan-ver')}>
                  <Text style={styles.addBtnIcon}>＋</Text>
                  <Text style={styles.addBtnText}>İlan Ekle</Text>
                </Pressable>
              </View>

              {isLoading ? (
                <ActivityIndicator color="#3D1A78" style={{ marginTop: 40 }} />
              ) : userListings.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>📦</Text>
                  <Text style={styles.emptyTitle}>Henüz ilanınız yok</Text>
                  <Text style={styles.emptyDesc}>İlk ilanınızı vererek satışa başlayın</Text>
                  <Pressable style={styles.emptyBtn} onPress={() => router.push('/ilan-ver')}>
                    <Text style={styles.emptyBtnText}>İlan Ver</Text>
                  </Pressable>
                </View>
              ) : (
                <View nativeID="pz-profile-grid" style={styles.listingGrid}>
                  {userListings.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.listingCard}
                      onPress={() => router.push(`/listing/${item.id}`)}
                    >
                      <Image source={{ uri: item.image }} style={styles.listingImage} />
                      <View style={styles.listingBody}>
                        <Text style={styles.listingPrice}>{formatPrice(item.price)}</Text>
                        <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.listingMeta}>{item.views} görüntülenme</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </WebPage>
      </ScrollView>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
  layout: { flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' },
  sidebar: { width: 300, gap: 16, flexGrow: 1 },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2D9F0',
    gap: 8,
    width: '100%',
  },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#C9A84C' },
  name: { fontSize: 22, fontWeight: '800', color: '#1A0A2E', marginTop: 8 },
  email: { fontSize: 14, color: '#7A6B8A' },
  city: { fontSize: 13, color: '#7A6B8A' },
  bio: { fontSize: 13, color: '#7A6B8A', textAlign: 'center', lineHeight: 20, marginTop: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedIcon: { fontSize: 12, color: '#C9A84C', fontWeight: '800' },
  verifiedText: { fontSize: 12, fontWeight: '700', color: '#C9A84C' },
  editBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E0F4',
    backgroundColor: '#F4F1FA',
  },
  editBtnText: { color: '#3D1A78', fontWeight: '700', fontSize: 13 },
  editForm: { width: '100%', gap: 6, marginTop: 8 },
  editLabel: { fontSize: 12, fontWeight: '700', color: '#7A6B8A', marginTop: 4 },
  editInput: {
    borderWidth: 1,
    borderColor: '#E8E0F4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A0A2E',
    backgroundColor: '#FAFAFA',
  },
  editBio: { height: 72, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E0F4',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#7A6B8A', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#3D1A78',
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2D9F0',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#3D1A78' },
  statLabel: { fontSize: 11, color: '#7A6B8A', marginTop: 2 },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2D9F0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBF8',
  },
  menuIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  menuDanger: { borderBottomWidth: 0 },
  menuText: { fontSize: 15, fontWeight: '600', color: '#1A0A2E' },
  main: { flex: 1, minWidth: 280 },
  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: '800', color: '#1A0A2E' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3D1A78',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnIcon: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 60,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2D9F0',
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A0A2E' },
  emptyDesc: { fontSize: 14, color: '#7A6B8A' },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#3D1A78',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#FFFFFF', fontWeight: '700' },
  listingGrid: { width: '100%' },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2D9F0',
  },
  listingImage: { width: '100%', height: 160, backgroundColor: '#EDE8F5' },
  listingBody: { padding: 12, gap: 4 },
  listingPrice: { fontSize: 16, fontWeight: '800', color: '#3D1A78' },
  listingTitle: { fontSize: 13, fontWeight: '600', color: '#1A0A2E', lineHeight: 18 },
  listingMeta: { fontSize: 11, color: '#7A6B8A' },
});
