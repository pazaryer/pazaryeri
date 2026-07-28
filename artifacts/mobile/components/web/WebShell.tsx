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
import { WEB_THEME } from '@/lib/web-theme';
import { flatStyle } from '@/lib/flat-style';

const NAV_CATEGORIES = WEB_CATEGORIES.filter((c) => c.label !== 'Tüm İlanlar');
const MOBILE_BREAKPOINT = 640;

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
  const { user } = useAuth();
  const mobile = width < MOBILE_BREAKPOINT;

  const sellPath = user ? '/ilan-ver' : '/kayit';

  return (
    <View nativeID="pz-web-shell" style={[styles.root, mobile && styles.rootMobile]}>
      <View nativeID="pz-web-header" style={styles.header}>
        {/* Üst satır: logo + arama + aksiyonlar */}
        <View style={[styles.topBar, mobile && styles.topBarMobile]}>
          <Link href="/" asChild>
            <Pressable style={styles.brand}>
              <Logo size={mobile ? 30 : 34} />
              {!mobile && <Text style={styles.brandText}>Pazaryeri</Text>}
            </Pressable>
          </Link>

          {mobile ? (
            <Pressable style={styles.locationPillMobile} onPress={() => router.push('/kesfet')}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationTextMobile} numberOfLines={1}>
                Türkiye
              </Text>
            </Pressable>
          ) : (
            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={onSearchChange}
                onSubmitEditing={onSearchSubmit}
                placeholder="İlan, marka, kategori ara..."
                placeholderTextColor={WEB_THEME.textLight}
                style={styles.searchInput}
                returnKeyType="search"
              />
            </View>
          )}

          <View style={styles.actions}>
            {!mobile && (
              <Pressable style={styles.locationPill} onPress={() => router.push('/kesfet')}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>Türkiye</Text>
              </Pressable>
            )}

            {user ? (
              <>
                <Pressable style={styles.iconBtn} onPress={() => router.push('/mesajlar')}>
                  <Text style={styles.iconBtnText}>💬</Text>
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => router.push('/hesabim')}>
                  <Text style={styles.iconBtnText}>👤</Text>
                </Pressable>
              </>
            ) : (
              <Link href="/giris" asChild>
                <Pressable style={styles.loginBtn}>
                  <Text style={styles.loginText}>Giriş</Text>
                </Pressable>
              </Link>
            )}

            <Pressable style={styles.sellBtn} onPress={() => router.push(sellPath)}>
              <Text style={styles.sellIcon}>📷</Text>
              <Text style={styles.sellText}>Sat</Text>
            </Pressable>
          </View>
        </View>

        {/* Mobil arama */}
        {mobile && (
          <View style={styles.searchWrapMobile}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={onSearchChange}
              onSubmitEditing={onSearchSubmit}
              placeholder="İlan, marka, kategori ara..."
              placeholderTextColor={WEB_THEME.textLight}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
        )}

        {/* Kategori navigasyonu — letgo tarzı metin linkler */}
        <ScrollView
          nativeID="pz-header-nav"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navRow}
          style={styles.navScroll}
        >
          <Link href="/kesfet" asChild>
            <Pressable style={styles.navAllBtn}>
              <Text style={styles.navAllIcon}>☰</Text>
              <Text style={styles.navAllText}>Tüm Kategoriler</Text>
            </Pressable>
          </Link>
          {NAV_CATEGORIES.slice(0, mobile ? 8 : 14).map((cat) => (
            <Link key={cat.label} href={cat.href as any} asChild>
              <Pressable style={styles.navLink}>
                <Text style={styles.navLinkText}>{cat.label}</Text>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      </View>

      <View nativeID="pz-web-main" style={[styles.main, mobile && styles.mainMobile]}>
        {children}
      </View>

      {!hideFooter && (
        <View style={[styles.footer, mobile && styles.footerMobile]}>
          <View style={[styles.footerInner, mobile && styles.footerInnerMobile]}>
            <View style={styles.footerBrand}>
              <Logo size={24} />
              <Text style={styles.footerTitle}>Pazaryeri</Text>
              <Text style={styles.footerTagline}>Türkiye'nin ikinci el pazarı</Text>
            </View>
            <View style={[styles.footerLinks, mobile && styles.footerLinksMobile]}>
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
            <Text style={styles.footerCopy}>
              © {new Date().getFullYear()} Pazaryeri — İkinci el al & sat
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WEB_THEME.bg, minHeight: '100%', width: '100%' },
  rootMobile: { flexGrow: 1, flexShrink: 0 },
  header: {
    backgroundColor: WEB_THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: WEB_THEME.border,
    width: '100%',
  },
  topBar: {
    maxWidth: WEB_THEME.maxWidth,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  topBarMobile: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, gap: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  brandText: { fontSize: 24, fontWeight: '900', color: WEB_THEME.brand, letterSpacing: -0.5 },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WEB_THEME.surface,
    borderWidth: 1.5,
    borderColor: WEB_THEME.border,
    borderRadius: WEB_THEME.radiusPill,
    paddingHorizontal: 16,
    height: 46,
    gap: 8,
    minWidth: 0,
  },
  searchWrapMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WEB_THEME.surface,
    borderWidth: 1.5,
    borderColor: WEB_THEME.border,
    borderRadius: WEB_THEME.radiusPill,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: { fontSize: 16, flexShrink: 0 },
  searchInput: { flex: 1, fontSize: 14, color: WEB_THEME.text, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: WEB_THEME.radiusPill,
    borderWidth: 1,
    borderColor: WEB_THEME.border,
    backgroundColor: WEB_THEME.surface,
  },
  locationPillMobile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: WEB_THEME.radiusPill,
    borderWidth: 1,
    borderColor: WEB_THEME.border,
    minWidth: 0,
  },
  locationIcon: { fontSize: 13 },
  locationText: { fontSize: 13, fontWeight: '600', color: WEB_THEME.text },
  locationTextMobile: { fontSize: 12, fontWeight: '600', color: WEB_THEME.text, flex: 1 },
  loginBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  loginText: { fontSize: 14, fontWeight: '700', color: WEB_THEME.text },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: WEB_THEME.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 16 },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: WEB_THEME.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: WEB_THEME.radiusPill,
  },
  sellText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  sellIcon: { fontSize: 14 },
  navScroll: { width: '100%', borderTopWidth: 1, borderTopColor: WEB_THEME.borderLight },
  navRow: {
    maxWidth: WEB_THEME.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WEB_THEME.border,
    marginRight: 4,
    backgroundColor: WEB_THEME.surface,
  },
  navAllIcon: { fontSize: 12, color: WEB_THEME.text },
  navAllText: { fontSize: 13, fontWeight: '700', color: WEB_THEME.text },
  navLink: { paddingHorizontal: 10, paddingVertical: 7 },
  navLinkText: { fontSize: 13, fontWeight: '500', color: WEB_THEME.textMuted },
  main: { flex: 1, width: '100%', backgroundColor: WEB_THEME.bg },
  mainMobile: { flexGrow: 0, flexShrink: 0 },
  footer: {
    backgroundColor: WEB_THEME.surface,
    borderTopWidth: 1,
    borderTopColor: WEB_THEME.border,
    paddingVertical: 28,
    width: '100%',
    marginTop: 'auto',
  },
  footerMobile: { paddingVertical: 24 },
  footerInner: {
    maxWidth: WEB_THEME.maxWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  footerInnerMobile: { alignItems: 'center' },
  footerBrand: { gap: 4 },
  footerTitle: { fontSize: 18, fontWeight: '900', color: WEB_THEME.brand },
  footerTagline: { fontSize: 13, color: WEB_THEME.textMuted },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  footerLinksMobile: { justifyContent: 'center', gap: 16 },
  footerLink: { fontSize: 13, fontWeight: '600', color: WEB_THEME.text },
  footerCopy: { fontSize: 12, color: WEB_THEME.textLight },
});
