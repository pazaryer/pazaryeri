import { DEFAULT_APP_CONFIG } from "./app-config-defaults";

export type BrandAssets = {
  iconUrl?: string | null;
  logoUrl?: string | null;
  splashUrl?: string | null;
  faviconUrl?: string | null;
  ogImageUrl?: string | null;
  adaptiveIconUrl?: string | null;
};

export type BrandColors = {
  primary: string;
  primaryDark: string;
  primaryMid: string;
  primaryLight: string;
  gold: string;
  background: string;
};

export type BrandingBundle = {
  name: string;
  tagline: string;
  supportEmail: string;
  colors: BrandColors;
  assets: BrandAssets;
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  app: {
    version: string;
    minSupportedVersion: string;
    forceUpdate: boolean;
    updateMessage: string;
  };
};

const defaultBrand = DEFAULT_APP_CONFIG.brand as Record<string, unknown>;
const defaultSeo = DEFAULT_APP_CONFIG["web.seo"] as Record<string, string>;
const defaultApp = DEFAULT_APP_CONFIG["mobile.app"] as Record<string, unknown>;

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asAssets(value: unknown): BrandAssets {
  if (!value || typeof value !== "object") return {};
  const o = value as Record<string, unknown>;
  const pick = (k: keyof BrandAssets) => {
    const v = o[k];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  return {
    iconUrl: pick("iconUrl"),
    logoUrl: pick("logoUrl"),
    splashUrl: pick("splashUrl"),
    faviconUrl: pick("faviconUrl"),
    ogImageUrl: pick("ogImageUrl"),
    adaptiveIconUrl: pick("adaptiveIconUrl"),
  };
}

function asColors(brand: Record<string, unknown>): BrandColors {
  const d = defaultBrand;
  const pick = (k: keyof BrandColors) =>
    asString(brand[k], asString(d[k], "#3D1A78"));
  return {
    primary: pick("primary"),
    primaryDark: pick("primaryDark"),
    primaryMid: pick("primaryMid"),
    primaryLight: pick("primaryLight"),
    gold: pick("gold"),
    background: pick("background"),
  };
}

/** DB config kayıtlarından admin formu + mobil istemci için tek paket */
export function mergeBrandingBundle(config: Record<string, unknown>): BrandingBundle {
  const brand = (config.brand ?? {}) as Record<string, unknown>;
  const seo = (config["web.seo"] ?? {}) as Record<string, string>;
  const app = (config["mobile.app"] ?? {}) as Record<string, unknown>;
  const assets = asAssets(brand.assets);

  const name = asString(brand.name, asString(app.name, asString(seo.brand, "Pazaryeri")));
  const tagline = asString(brand.tagline, asString(seo.tagline, defaultSeo.tagline ?? ""));

  return {
    name,
    tagline,
    supportEmail: asString(brand.supportEmail, asString(defaultBrand.supportEmail, "pazaryer0@gmail.com")),
    colors: asColors(brand),
    assets,
    seo: {
      title: asString(seo.title, defaultSeo.title ?? `${name} — İkinci El Alım Satım`),
      description: asString(seo.description, defaultSeo.description ?? ""),
      keywords: asString(seo.keywords, defaultSeo.keywords ?? ""),
    },
    app: {
      version: asString(app.version, "1.0.0"),
      minSupportedVersion: asString(app.minSupportedVersion, "1.0.0"),
      forceUpdate: Boolean(app.forceUpdate),
      updateMessage: asString(app.updateMessage, "Yeni sürüm mevcut. Lütfen güncelleyin."),
    },
  };
}

/** Admin kaydından DB anahtarlarına dağıt */
export function brandingBundleToConfigKeys(bundle: BrandingBundle): {
  brand: Record<string, unknown>;
  "web.seo": Record<string, string>;
  "mobile.app": Record<string, unknown>;
} {
  return {
    brand: {
      name: bundle.name,
      tagline: bundle.tagline,
      supportEmail: bundle.supportEmail,
      primary: bundle.colors.primary,
      primaryDark: bundle.colors.primaryDark,
      primaryMid: bundle.colors.primaryMid,
      primaryLight: bundle.colors.primaryLight,
      gold: bundle.colors.gold,
      background: bundle.colors.background,
      assets: bundle.assets,
    },
    "web.seo": {
      brand: bundle.name,
      tagline: bundle.tagline,
      title: bundle.seo.title,
      description: bundle.seo.description,
      keywords: bundle.seo.keywords,
    },
    "mobile.app": {
      name: bundle.name,
      version: bundle.app.version,
      minSupportedVersion: bundle.app.minSupportedVersion,
      forceUpdate: bundle.app.forceUpdate,
      updateMessage: bundle.app.updateMessage,
    },
  };
}
