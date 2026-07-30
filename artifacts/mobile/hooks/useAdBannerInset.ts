import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { useAdMobConfig } from '@/lib/admob/config';
import { useCompactScreen } from '@/hooks/useCompactScreen';
import {
  getScrollPaddingTabBarOnly,
  getScrollPaddingWithAdBanner,
  getTabBarHeight,
  shouldShowAdBanner,
} from '@/lib/ad-banner-inset';

export function useAdBannerInset() {
  const insets = useSafeAreaInsets();
  const compact = useCompactScreen();
  const segments = useSegments();
  const admob = useAdMobConfig();
  const showBanner = shouldShowAdBanner(segments) && admob.banner.enabled;

  const scrollPaddingBottom = showBanner
    ? getScrollPaddingWithAdBanner(compact, insets.bottom)
    : getScrollPaddingTabBarOnly(compact, insets.bottom);

  return {
    showBanner,
    scrollPaddingBottom,
    tabBarHeight: getTabBarHeight(compact, insets.bottom),
  };
}
