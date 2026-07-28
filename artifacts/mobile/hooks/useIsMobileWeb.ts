import { Platform, useWindowDimensions } from 'react-native';

const MOBILE_WEB_BREAKPOINT = 640;
const TABLET_WEB_BREAKPOINT = 1024;

export function useIsMobileWeb(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width < MOBILE_WEB_BREAKPOINT;
}

export function useIsTabletWeb(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width < TABLET_WEB_BREAKPOINT;
}
