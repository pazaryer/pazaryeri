import { BRAND, SUPPORT_EMAIL } from '@/constants/brand';
import type { RemoteAppConfig } from '@/lib/remote-config';

export type BrandAssets = {
  iconUrl?: string | null;
  logoUrl?: string | null;
  splashUrl?: string | null;
  faviconUrl?: string | null;
  ogImageUrl?: string | null;
  adaptiveIconUrl?: string | null;
};

export type AppBrand = {
  name: string;
  tagline: string;
  supportEmail: string;
  primary: string;
  primaryDark: string;
  primaryMid: string;
  primaryLight: string;
  primaryMuted: string;
  gold: string;
  goldLight: string;
  text: string;
  textMuted: string;
  textLight: string;
  surface: string;
  background: string;
  border: string;
  destructive: string;
  assets: BrandAssets;
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
};

const DEFAULT_NAME = 'Pazaryeri';
const DEFAULT_TAGLINE = "Türkiye'nin ikinci el alım satım platformu";

function buildDefaultBrand(): AppBrand {
  return {
    name: DEFAULT_NAME,
    tagline: DEFAULT_TAGLINE,
    supportEmail: SUPPORT_EMAIL,
    primary: BRAND.primary,
    primaryDark: BRAND.primaryDark,
    primaryMid: BRAND.primaryMid,
    primaryLight: BRAND.primaryLight,
    primaryMuted: BRAND.primaryMuted,
    gold: BRAND.gold,
    goldLight: BRAND.goldLight,
    text: BRAND.text,
    textMuted: BRAND.textMuted,
    textLight: BRAND.textLight,
    surface: BRAND.surface,
    background: BRAND.background,
    border: BRAND.border,
    destructive: BRAND.destructive,
    assets: {},
    seo: {
      title: `${DEFAULT_NAME} — İkinci El Alım Satım | Ücretsiz İlan Ver`,
      description:
        "Pazaryeri ile ücretsiz ilan verin, ikinci el alım satım yapın. Telefon, araç, mobilya, elektronik ve binlerce kategoride güvenli ikinci el alışveriş.",
      keywords: 'pazaryeri, ikinci el, ücretsiz ilan, alım satım',
    },
  };
}

let runtimeBrand: AppBrand = buildDefaultBrand();

export function getAppBrand(): AppBrand {
  return runtimeBrand;
}

function pickAsset(assets: Record<string, unknown> | undefined, key: keyof BrandAssets): string | null {
  const v = assets?.[key];
  return typeof v === 'string' && v.trim().startsWith('http') ? v.trim() : null;
}

export function applyBrandFromRemote(config: RemoteAppConfig): AppBrand {
  const remote = (config.brand ?? {}) as Record<string, unknown>;
  const seo = config['web.seo'] ?? {};
  const app = config['mobile.app'] ?? {};
  const assetsRaw = (remote.assets ?? {}) as Record<string, unknown>;

  const name =
    (typeof remote.name === 'string' && remote.name.trim()) ||
    app.name ||
    seo.brand ||
    DEFAULT_NAME;

  runtimeBrand = {
    ...buildDefaultBrand(),
    name: String(name),
    tagline:
      (typeof remote.tagline === 'string' && remote.tagline.trim()) ||
      seo.tagline ||
      DEFAULT_TAGLINE,
    supportEmail:
      (typeof remote.supportEmail === 'string' && remote.supportEmail.trim()) || SUPPORT_EMAIL,
    primary: (remote.primary as string) || BRAND.primary,
    primaryDark: (remote.primaryDark as string) || BRAND.primaryDark,
    primaryMid: (remote.primaryMid as string) || BRAND.primaryMid,
    primaryLight: (remote.primaryLight as string) || BRAND.primaryLight,
    gold: (remote.gold as string) || BRAND.gold,
    background: (remote.background as string) || BRAND.background,
    assets: {
      iconUrl: pickAsset(assetsRaw, 'iconUrl'),
      logoUrl: pickAsset(assetsRaw, 'logoUrl'),
      splashUrl: pickAsset(assetsRaw, 'splashUrl'),
      faviconUrl: pickAsset(assetsRaw, 'faviconUrl'),
      ogImageUrl: pickAsset(assetsRaw, 'ogImageUrl'),
      adaptiveIconUrl: pickAsset(assetsRaw, 'adaptiveIconUrl'),
    },
    seo: {
      title: seo.title || `${name} — İkinci El Alım Satım`,
      description: seo.description || buildDefaultBrand().seo.description,
      keywords: seo.keywords || buildDefaultBrand().seo.keywords,
    },
  };

  return runtimeBrand;
}

export function getWebThemeFromBrand(brand: AppBrand = runtimeBrand) {
  return {
    bg: brand.background,
    surface: brand.surface,
    text: brand.text,
    textMuted: brand.textMuted,
    textLight: brand.textLight,
    border: brand.border,
    borderLight: brand.primaryLight,
    brand: brand.primary,
    brandDark: brand.primaryDark,
    brandMid: brand.primaryMid,
    brandLight: brand.primaryLight,
    gold: brand.gold,
    goldLight: brand.goldLight,
    cta: brand.primary,
    ctaText: '#FFFFFF',
    heroFrom: brand.primary,
    heroTo: brand.primaryMid,
    sectionTint: '#FAF8FD',
    radius: 12,
    radiusPill: 24,
    radiusCard: 16,
    maxWidth: 1200,
    mobileBreakpoint: 640,
    tabletBreakpoint: 1024,
  } as const;
}
