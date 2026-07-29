import { BRAND } from '@/constants/brand';
import { getWebThemeFromBrand } from '@/lib/brand-runtime';

/** Statik varsayılan — canlı marka için useWebTheme() kullanın */
export const WEB_THEME = getWebThemeFromBrand({
  ...BRAND,
  name: 'Pazaryeri',
  tagline: '',
  supportEmail: '',
  assets: {},
  seo: { title: '', description: '', keywords: '' },
});
