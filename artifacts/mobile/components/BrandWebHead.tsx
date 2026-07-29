import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useBrand } from '@/contexts/BrandContext';
import { sitePath } from '@/lib/config';

export function BrandWebHead() {
  const brand = useBrand();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    document.title = brand.seo.title;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('description', brand.seo.description);
    setMeta('keywords', brand.seo.keywords);
    setMeta('author', brand.name);
    setMeta('application-name', brand.name);
    setMeta('apple-mobile-web-app-title', brand.name);
    setMeta('theme-color', brand.primary);

    setMeta('og:site_name', brand.name, true);
    setMeta('og:title', brand.seo.title, true);
    setMeta('og:description', brand.seo.description, true);

    const ogImage = brand.assets.ogImageUrl || sitePath('/og-image.png');
    setMeta('og:image', ogImage, true);

    const favicon = brand.assets.faviconUrl || brand.assets.iconUrl;
    if (favicon) {
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = favicon;
    }
  }, [brand]);

  return null;
}
