import { useWindowDimensions } from 'react-native';

/** Küçük telefon ekranları (320–360px genişlik) */
export function useCompactScreen(): boolean {
  const { width } = useWindowDimensions();
  return width > 0 && width < 380;
}

/** Tablet veya geniş ekran */
export function useWideScreen(): boolean {
  const { width } = useWindowDimensions();
  return width >= 768;
}
