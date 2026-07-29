import { useBrand } from '@/contexts/BrandContext';
import { getWebThemeFromBrand } from '@/lib/brand-runtime';

export function useWebTheme() {
  const brand = useBrand();
  return getWebThemeFromBrand(brand);
}

/** @deprecated use useWebTheme() for remote brand colors */
export { getWebThemeFromBrand } from '@/lib/brand-runtime';
