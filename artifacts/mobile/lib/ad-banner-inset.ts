/** Tab bar gövde yüksekliği (safe area hariç) — (tabs)/_layout ile senkron */
export const TAB_BAR_BODY_HEIGHT_COMPACT = 54;
export const TAB_BAR_BODY_HEIGHT = 58;

/** Banner ile tab bar arası boşluk */
export const AD_BANNER_STACK_GAP = 6;

/** Kart kenarlığı + rozet için ek yükseklik */
export const AD_BANNER_CARD_EXTRA = 4;

/** AdMob standart banner yüksekliği */
export const ADMOB_NATIVE_BANNER_HEIGHT = 50;

export function getTabBarBodyHeight(compact: boolean): number {
  return compact ? TAB_BAR_BODY_HEIGHT_COMPACT : TAB_BAR_BODY_HEIGHT;
}

export function getTabBarHeight(compact: boolean, bottomInset: number): number {
  return getTabBarBodyHeight(compact) + bottomInset;
}

export function getAdBannerSlotHeight(): number {
  return ADMOB_NATIVE_BANNER_HEIGHT + AD_BANNER_CARD_EXTRA;
}

/** Banner alt kenarının ekran altından uzaklığı (tab bar üstünde) */
export function getAdBannerBottomOffset(compact: boolean, bottomInset: number): number {
  return getTabBarHeight(compact, bottomInset) + AD_BANNER_STACK_GAP;
}

/** ScrollView contentContainerStyle paddingBottom — tab bar + banner + ek boşluk */
export function getScrollPaddingWithAdBanner(compact: boolean, bottomInset: number): number {
  return (
    getTabBarHeight(compact, bottomInset) +
    getAdBannerSlotHeight() +
    AD_BANNER_STACK_GAP +
    20
  );
}

/** ScrollView paddingBottom — sadece tab bar (banner yok) */
export function getScrollPaddingTabBarOnly(compact: boolean, bottomInset: number): number {
  return getTabBarHeight(compact, bottomInset) + 20;
}

const BANNER_TAB_ROUTES = new Set(['index', 'explore', 'messages', 'profile']);

/** Reklam banner'ı yalnızca ana tab ekranlarında göster; auth/onboarding/formda gizle */
export function shouldShowAdBanner(segments: string[]): boolean {
  if (segments[0] !== '(tabs)') return false;
  const tabRoute = segments[1] ?? 'index';
  return BANNER_TAB_ROUTES.has(tabRoute);
}
