import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { WEB_CATEGORIES } from '@/lib/categories';
import { WebAnnouncementBanner } from './WebAnnouncementBanner';

const HEADER_CATEGORIES = WEB_CATEGORIES;

interface WebShellProps {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: () => void;
  hideFooter?: boolean;
}

export function WebShell({
  children,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  hideFooter,
}: WebShellProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { user, profile } = useAuth();
  const mobile = width < 640;
  const tablet = width < 1024;

  return (
    <View style={styles.root}>
      <WebAnnouncementBanner />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Link href="/" asChild>
            <Pressable style={styles.brand}>
              <Logo size={mobile ? 30 : 36} />
              {!mobile && <Text style={styles.brandText}>Pazaryeri</Text>}
            </Pressable>
          </Link>

          {!mobile && (
            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={onSearchChange}
                onSubmitEditing={onSearchSubmit}
                placeholder={tablet ? 'Ara...' : 'Ne aramıştınız? Telefon, araba, mobilya...'}
                placeholderTextColor="#9D8BB5"
                style={styles.searchInput}
                returnKeyType="search"
              />
            </View>
          )}

          <View style={styles.headerActions}>
            {user ? (
              <>
                <Pressable style={styles.actionBtn} onPress={() => router.push('/ilan-ver')}>
                  <Text style={styles.actionIcon}>＋</Text>
                  {!tablet && <Text style={styles.actionText}>İlan Ver</Text>}
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => router.push('/mesajlar')}>
                  <Text style={styles.actionIcon}>💬</Text>
                  {!tablet && <Text style={styles.actionText}>Mesajlar</Text>}
                </Pressable>
                <Pressable style={styles.profileBtn} onPress={() => router.push('/hesabim')}>
                  <Text style={styles.profileBtnText}>
                    {profile?.name?.split(' ')[0] ?? 'Hesabım'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Link href="/giris" asChild>
                  <Pressable style={styles.ghostBtn}>
                    <Text style={styles.ghostBtnText}>Giriş</Text>
                  </Pressable>
                </Link>
                <Link href="/kayit" asChild>
                  <Pressable style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>{mobile ? 'Kayıt' : 'Kayıt Ol'}</Text>
                  </Pressable>
                </Link>
              </>
            )}
          </View>
        </View>

        {mobile && (
          <View style={styles.searchWrapMobile}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={onSearchChange}
              onSubmitEditing={onSearchSubmit}
              placeholder="Ne aramıştınız?"
              placeholderTextColor="#9D8BB5"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navRow}
          style={styles.navScroll}
        >
          {HEADER_CATEGORIES.map((cat) => (
            <Link key={cat.label} href={cat.href as any} asChild>
              <Pressable style={styles.navChip}>
                <Text style={styles.navChipText}>
                  {cat.icon} {cat.label}
                </Text>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      </View>

      <View style={styles.main}>{children}</View>

      {!hideFooter && (
        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={styles.footerLeft}>
              <Logo size={24} />
              <Text style={styles.footerTitle}>Pazaryeri</Text>
            </View>
            <View style={styles.footerLinks}>
              <Link href="/kesfet" asChild>
                <Pressable><Text style={styles.footerLink}>İlanlar</Text></Pressable>
              </Link>
              {user ? (
                <>
                  <Pressable onPress={() => router.push('/hesabim')}>
                    <Text style={styles.footerLink}>Hesabım</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push('/ilan-ver')}>
                    <Text style={styles.footerLink}>İlan Ver</Text>
                  </Pressable>
                </>
              ) : (
                <Link href="/giris" asChild>
                  <Pressable><Text style={styles.footerLink}>Giriş</Text></Pressable>
                </Link>
              )}
              <Link href="/terms" asChild>
                <Pressable><Text style={styles.footerLink}>Şartlar</Text></Pressable>
              </Link>
              <Link href="/privacy" asChild>
                <Pressable><Text style={styles.footerLink}>Gizlilik</Text></Pressable>
              </Link>
            </View>
            <Text style={styles.footerCopy}>© {new Date().getFullYear()} Pazaryeri</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent', minHeight: '100%', width: '100%' },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0F4',
    width: '100%',
    shadowColor: '#3D1A78',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  headerTop: {
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  brandText: { fontSize: 22, fontWeight: '800', color: '#1A0A2E', letterSpacing: -0.8 },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F1FA',
    borderWidth: 1.5,
    borderColor: '#E8E0F4',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    minWidth: 0,
  },
  searchWrapMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F1FA',
    borderWidth: 1.5,
    borderColor: '#E8E0F4',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchIcon: { fontSize: 15, flexShrink: 0 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A0A2E', outlineStyle: 'none', minWidth: 0 } as any,
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    marginLeft: 'auto',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F4F1FA',
  },
  actionIcon: { fontSize: 15 },
  actionText: { color: '#3D1A78', fontWeight: '700', fontSize: 13 },
  ghostBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  ghostBtnText: { color: '#3D1A78', fontWeight: '700', fontSize: 13 },
  primaryBtn: {
    backgroundColor: '#3D1A78',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  profileBtn: {
    backgroundColor: '#3D1A78',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  profileBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  navScroll: { width: '100%' },
  navRow: {
    maxWidth: 1400,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F6FC',
    borderWidth: 1,
    borderColor: '#E8E0F4',
  },
  navChipText: { color: '#3D1A78', fontWeight: '600', fontSize: 11 },
  main: { flex: 1, width: '100%', alignSelf: 'stretch', backgroundColor: 'transparent' },
  footer: {
    backgroundColor: '#1A0A2E',
    paddingVertical: 16,
    width: '100%',
    marginTop: 'auto',
  },
  footerInner: {
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  footerLink: { color: '#C9A84C', fontSize: 13, fontWeight: '600' },
  footerCopy: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
});
