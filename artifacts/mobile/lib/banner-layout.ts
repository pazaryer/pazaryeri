import { Platform, useWindowDimensions } from 'react-native';

/** AdMob standart banner oranı 320×50 */
export const BANNER_ASPECT = 320 / 50;
export const BANNER_BORDER_RADIUS = 8;
export const BANNER_INSET_H = 12;

const MAX_NATIVE = 280;
const MAX_WEB_MOBILE = 288;
const MAX_WEB_TABLET = 300;
const MAX_WEB_DESKTOP = 320;

export function resolveBannerWidth(screenWidth: number): number {
  const available = Math.max(200, screenWidth - BANNER_INSET_H * 2);
  if (Platform.OS === 'web') {
    if (screenWidth < 768) return Math.min(MAX_WEB_MOBILE, available);
    if (screenWidth < 1200) return Math.min(MAX_WEB_TABLET, available);
    return Math.min(MAX_WEB_DESKTOP, available);
  }
  return Math.min(MAX_NATIVE, available);
}

export function bannerHeightForWidth(width: number): number {
  return Math.round(width / BANNER_ASPECT);
}

export function useBannerLayout() {
  const { width: screenWidth } = useWindowDimensions();
  const width = resolveBannerWidth(screenWidth);
  const height = bannerHeightForWidth(width);
  const admobScale = width / 320;
  return { width, height, admobScale, screenWidth };
}
