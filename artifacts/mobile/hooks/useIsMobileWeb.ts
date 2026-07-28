import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

const MOBILE_WEB_BREAKPOINT = 640;
const TABLET_WEB_BREAKPOINT = 1024;

export function useIsMobileWeb(): boolean {
  const { width } = useWindowDimensions();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready && Platform.OS === 'web' && width > 0 && width < MOBILE_WEB_BREAKPOINT;
}

export function useIsTabletWeb(): boolean {
  const { width } = useWindowDimensions();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready && Platform.OS === 'web' && width > 0 && width < TABLET_WEB_BREAKPOINT;
}
