import { DEFAULT_APP_CONFIG } from "./app-config-defaults";

export type MobileDeveloperConfig = {
  enabled: boolean;
  signatureLabel: string;
  rateApp: {
    enabled: boolean;
    label: string;
    androidUrl: string | null;
    iosUrl: string | null;
    webUrl: string | null;
  };
  otherApps: {
    enabled: boolean;
    label: string;
    url: string | null;
  };
};

export type SponsorBannerConfig = {
  enabled: boolean;
  imageUrl: string | null;
  linkUrl: string | null;
  altText: string;
};

export type MobilePromoBundle = {
  developer: MobileDeveloperConfig;
  sponsorBanner: SponsorBannerConfig;
};

const DEFAULT_DEVELOPER = DEFAULT_APP_CONFIG["mobile.developer"] as MobileDeveloperConfig;
const DEFAULT_SPONSOR = DEFAULT_APP_CONFIG["mobile.sponsorBanner"] as SponsorBannerConfig;

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function nullableStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function mergeMobilePromo(config: Record<string, unknown>): MobilePromoBundle {
  const dev = (config["mobile.developer"] ?? {}) as Record<string, unknown>;
  const rate = (dev.rateApp ?? {}) as Record<string, unknown>;
  const other = (dev.otherApps ?? {}) as Record<string, unknown>;
  const sponsor = (config["mobile.sponsorBanner"] ?? {}) as Record<string, unknown>;

  return {
    developer: {
      enabled: bool(dev.enabled, DEFAULT_DEVELOPER.enabled),
      signatureLabel: str(dev.signatureLabel, DEFAULT_DEVELOPER.signatureLabel),
      rateApp: {
        enabled: bool(rate.enabled, DEFAULT_DEVELOPER.rateApp.enabled),
        label: str(rate.label, DEFAULT_DEVELOPER.rateApp.label),
        androidUrl: nullableStr(rate.androidUrl) ?? DEFAULT_DEVELOPER.rateApp.androidUrl,
        iosUrl: nullableStr(rate.iosUrl) ?? DEFAULT_DEVELOPER.rateApp.iosUrl,
        webUrl: nullableStr(rate.webUrl) ?? DEFAULT_DEVELOPER.rateApp.webUrl,
      },
      otherApps: {
        enabled: bool(other.enabled, DEFAULT_DEVELOPER.otherApps.enabled),
        label: str(other.label, DEFAULT_DEVELOPER.otherApps.label),
        url: nullableStr(other.url) ?? DEFAULT_DEVELOPER.otherApps.url,
      },
    },
    sponsorBanner: {
      enabled: bool(sponsor.enabled, DEFAULT_SPONSOR.enabled),
      imageUrl: nullableStr(sponsor.imageUrl) ?? DEFAULT_SPONSOR.imageUrl,
      linkUrl: nullableStr(sponsor.linkUrl) ?? DEFAULT_SPONSOR.linkUrl,
      altText: str(sponsor.altText, DEFAULT_SPONSOR.altText),
    },
  };
}

export function mobilePromoToConfigKeys(bundle: MobilePromoBundle): Record<string, unknown> {
  return {
    "mobile.developer": bundle.developer,
    "mobile.sponsorBanner": bundle.sponsorBanner,
  };
}
