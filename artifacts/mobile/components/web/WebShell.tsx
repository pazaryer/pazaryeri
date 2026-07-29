import React, { useMemo } from 'react';
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
import { WebLocationProvider, useWebLocation } from '@/contexts/WebLocationContext';
import { WebLocationPicker } from './WebLocationPicker';
import { WEB_CATEGORIES } from '@/lib/categories';
import { useWebTheme } from '@/hooks/useWebTheme';
import { useBrand } from '@/contexts/BrandContext';
import { WEB_THEME } from '@/lib/web-theme';
import { useNotifications, useConversations } from '@/lib/hooks';
import { DevByAltunBadge } from '@/components/DevByAltunBadge';
import { SponsorBanner } from '@/components/SponsorBanner';

const NAV_CATEGORIES = WEB_CATEGORIES.filter((c) => c.label !== 'Tüm İlanlar');

interface WebShellProps {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: () => void;
  hideFooter?: boolean;
}

export function WebShell(props: WebShellProps) {
  return (
    <WebLocationProvider>
      <WebShellInner {...props} />
      <WebLocationPicker />
    </WebLocationProvider>
  );
}

function WebShellInner({
  children,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  hideFooter,
}: WebShellProps) {
  const theme = useWebTheme();
  const brand = useBrand();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { user } = useAuth();
  const { label, openPicker } = useWebLocation();
  const { data: notifData } = useNotifications(!!user);
  const { data: convoData } = useConversations(!!user);
  const mobile = width < theme.mobileBreakpoint;
  const tablet = width >= theme.mobileBreakpoint && width < theme.tabletBreakpoint;

  const unreadNotifs = notifData?.items.filter((n) => !n.isRead).length ?? 0;
  const unreadMessages = useMemo(
    () => (convoData?.items ?? []).reduce((sum, c) => sum + c.unreadCount, 0),
    [convoData?.items],
  );

  const sellPath = user ? '/ilan-ver' : '/kayit';

  return (
    <View nativeID="pz-web-shell" style={[styles.root, mobile && styles.rootMobile]}>
      <View nativeID="pz-web-header" style={styles.header}>
        <View style={[styles.topBar, mobile && styles.topBarMobile]}>
          <Link href="/" asChild>
            <Pressable style={styles.brand}>
              <View style={[styles.brandMark, mobile && styles.brandMarkMobile, { backgroundColor: theme.brandLight }]}>
                <Logo size={mobile ? 20 : 22} color={theme.brand} />
              </View>
              {!mobile && <Text style={[styles.brandText, { color: theme.brand }]}>{brand.name}</Text>}
            </Pressable>
          </Link>

          {mobile ? (
            <Pressable style={styles.locationPillMobile} onPress={openPicker}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationTextMobile} numberOfLines={1}>
                {label}
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
                placeholderTextColor={theme.textLight}
                style={styles.searchInput}
                returnKeyType="search"
              />
            </View>
          )}

          <View style={styles.actions}>
            {!mobile && (
              <Pressable style={styles.locationPill} onPress={openPicker}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{label}</Text>
                <Text style={styles.locationChevron}>▼</Text>
              </Pressable>
            )}

            {user ? (
              <>
                <Pressable style={styles.iconBtn} onPress={() => router.push('/favorilerim')}>
                  <Text style={styles.iconBtnText}>❤️</Text>
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications')}>
                  <Text style={styles.iconBtnText}>🔔</Text>
                  {unreadNotifs > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text>
                    </View>
                  )}
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => router.push('/mesajlar')}>
                  <Text style={styles.iconBtnText}>💬</Text>
                  {unreadMessages > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadMessages > 9 ? '9+' : unreadMessages}</Text>
                    </View>
                  )}
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

            <Pressable style={styles.ctaBtn} onPress={() => router.push(sellPath)}>
              <Text style={styles.ctaIcon}>＋</Text>
              <Text style={styles.ctaText}>İlan Ver</Text>
            </Pressable>
          </View>
        </View>

        {mobile && (
          <View style={styles.searchWrapMobile}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={onSearchChange}
              onSubmitEditing={onSearchSubmit}
              placeholder="İlan, marka, kategori ara..."
              placeholderTextColor={theme.textLight}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
        )}

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
          {NAV_CATEGORIES.slice(0, mobile ? 6 : tablet ? 10 : 14).map((cat) => (
            <Link key={cat.label} href={cat.href as any} asChild>
              <Pressable style={styles.navLink}>
                <Text style={styles.navLinkText}>{cat.label}</Text>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      </View>

      <View nativeID="pz-web-main" style={[styles.main, mobile && styles.mainMobile]}>
        <SponsorBanner variant="inline" />
        {children}
      </View>

      {!hideFooter && (
        <View nativeID="pz-web-footer" style={[styles.footer, mobile && styles.footerMobile]}>
          <View style={[styles.footerInner, mobile && styles.footerInnerMobile]}>
            <View style={styles.footerBrandRow}>
              <View style={styles.footerMark}>
                <Logo size={16} color={theme.brand} />
              </View>
              <Text style={[styles.footerBrandName, { color: theme.brand }]}>{brand.name}</Text>
              {!mobile && (
                <>
                  <Text style={styles.footerSep}>·</Text>
                  <Text style={styles.footerTagline}>{brand.tagline}</Text>
                </>
              )}
            </View>

            <View style={[styles.footerLinks, mobile && styles.footerLinksMobile]}>
              <Link href="/kesfet" asChild>
                <Pressable><Text style={styles.footerLink}>İlanlar</Text></Pressable>
              </Link>
              <Text style={styles.footerSep}>·</Text>
              <Link href="/kesfet" asChild>
                <Pressable><Text style={styles.footerLink}>Keşfet</Text></Pressable>
              </Link>
              <Text style={styles.footerSep}>·</Text>
              {user ? (
                <Pressable onPress={() => router.push('/ilan-ver')}>
                  <Text style={styles.footerLink}>İlan Ver</Text>
                </Pressable>
              ) : (
                <Link href="/kayit" asChild>
                  <Pressable><Text style={styles.footerLink}>İlan Ver</Text></Pressable>
                </Link>
              )}
              <Text style={styles.footerSep}>·</Text>
              {user ? (
                <Pressable onPress={() => router.push('/hesabim')}>
                  <Text style={styles.footerLink}>Hesabım</Text>
                </Pressable>
              ) : (
                <Link href="/giris" asChild>
                  <Pressable><Text style={styles.footerLink}>Giriş</Text></Pressable>
                </Link>
              )}
              <Text style={styles.footerSep}>·</Text>
              <Link href="/privacy" asChild>
                <Pressable><Text style={styles.footerLink}>Gizlilik</Text></Pressable>
              </Link>
            </View>

            {mobile && (
              <Text style={styles.footerTaglineMobile}>İkinci el alım satım · Ücretsiz ilan</Text>
            )}

            <DevByAltunBadge />

            <Text style={styles.footerCopy}>
              © {new Date().getFullYear()} Pazaryeri
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
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: WEB_THEME.brandLight,
    borderWidth: 1,
    borderColor: WEB_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkMobile: { width: 32, height: 32, borderRadius: 8 },
  brandText: { fontSize: 21, fontWeight: '800', color: WEB_THEME.brand, letterSpacing: -0.3 },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WEB_THEME.brandLight,
    borderWidth: 1,
    borderColor: WEB_THEME.border,
    borderRadius: WEB_THEME.radiusPill,
    paddingHorizontal: 16,
    height: 44,
    gap: 8,
    minWidth: 0,
  },
  searchWrapMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WEB_THEME.brandLight,
    borderWidth: 1,
    borderColor: WEB_THEME.border,
    borderRadius: WEB_THEME.radiusPill,
    paddingHorizontal: 14,
    height: 42,
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: { fontSize: 15, flexShrink: 0 },
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
  locationIcon: { fontSize: 12 },
  locationText: { fontSize: 13, fontWeight: '600', color: WEB_THEME.text },
  locationTextMobile: { fontSize: 12, fontWeight: '600', color: WEB_THEME.text, flex: 1 },
  locationChevron: { fontSize: 8, color: WEB_THEME.textMuted, marginLeft: 2 },
  loginBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  loginText: { fontSize: 14, fontWeight: '700', color: WEB_THEME.brand },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WEB_THEME.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBtnText: { fontSize: 15 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: WEB_THEME.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: WEB_THEME.cta,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: WEB_THEME.radiusPill,
    borderWidth: 1,
    borderColor: WEB_THEME.brandDark,
  },
  ctaText: { color: WEB_THEME.ctaText, fontWeight: '700', fontSize: 13 },
  ctaIcon: { color: WEB_THEME.gold, fontWeight: '700', fontSize: 15, lineHeight: 16 },
  navScroll: { width: '100%', borderTopWidth: 1, borderTopColor: WEB_THEME.borderLight },
  navRow: {
    maxWidth: WEB_THEME.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WEB_THEME.border,
    marginRight: 4,
    backgroundColor: WEB_THEME.surface,
  },
  navAllIcon: { fontSize: 11, color: WEB_THEME.text },
  navAllText: { fontSize: 12, fontWeight: '700', color: WEB_THEME.text },
  navLink: { paddingHorizontal: 9, paddingVertical: 6 },
  navLinkText: { fontSize: 12, fontWeight: '500', color: WEB_THEME.textMuted },
  main: { flex: 1, width: '100%', backgroundColor: WEB_THEME.bg },
  mainMobile: { flexGrow: 0, flexShrink: 0 },
  footer: {
    backgroundColor: WEB_THEME.surface,
    borderTopWidth: 1,
    borderTopColor: WEB_THEME.borderLight,
    paddingVertical: 22,
    width: '100%',
    marginTop: 'auto',
  },
  footerMobile: { paddingVertical: 18 },
  footerInner: {
    maxWidth: WEB_THEME.maxWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  footerInnerMobile: { paddingHorizontal: 16, gap: 8 },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerMark: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: WEB_THEME.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: WEB_THEME.border,
  },
  footerBrandName: { fontSize: 14, fontWeight: '700', color: WEB_THEME.brand },
  footerTagline: { fontSize: 12, color: WEB_THEME.textLight, fontWeight: '400' },
  footerTaglineMobile: { fontSize: 11, color: WEB_THEME.textLight, textAlign: 'center' },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  footerLinksMobile: { gap: 4 },
  footerLink: { fontSize: 12, fontWeight: '500', color: WEB_THEME.textMuted },
  footerSep: { fontSize: 12, color: WEB_THEME.border, fontWeight: '300' },
  footerCopy: { fontSize: 10, color: WEB_THEME.textLight, letterSpacing: 0.2 },
});
