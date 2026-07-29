import { DEFAULT_APP_CONFIG } from "./app-config-defaults";
import {
  defaultSponsorBanners,
  type SponsorBannerItem,
  type SponsorPlacementId,
  SPONSOR_PLACEMENTS,
} from "./sponsor-placements";

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

/** @deprecated Tek banner — geriye dönük uyumluluk */
export type SponsorBannerConfig = {
  enabled: boolean;
  imageUrl: string | null;
  linkUrl: string | null;
  altText: string;
};

export type MobilePromoBundle = {
  developer: MobileDeveloperConfig;
  sponsorBanners: SponsorBannerItem[];
  /** @deprecated Yazılımda home placement ile senkron tutulur */
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

function mergeBannerItem(
  placement: SponsorPlacementId,
  raw: Partial<SponsorBannerItem> | undefined,
  legacy?: SponsorBannerConfig,
): SponsorBannerItem {
  const useLegacy = legacy && (placement === "home" || placement === "web");
  return {
    placement,
    enabled: bool(raw?.enabled, useLegacy ? legacy!.enabled : false),
    imageUrl: nullableStr(raw?.imageUrl) ?? (useLegacy ? legacy!.imageUrl : null),
    linkUrl: nullableStr(raw?.linkUrl) ?? (useLegacy ? legacy!.linkUrl : null),
    altText: str(raw?.altText, useLegacy ? legacy!.altText : "Sponsor"),
  };
}

export function mergeSponsorBanners(config: Record<string, unknown>): SponsorBannerItem[] {
  const legacy = (config["mobile.sponsorBanner"] ?? {}) as Record<string, unknown>;
  const legacyCfg: SponsorBannerConfig = {
    enabled: bool(legacy.enabled, DEFAULT_SPONSOR.enabled),
    imageUrl: nullableStr(legacy.imageUrl) ?? DEFAULT_SPONSOR.imageUrl,
    linkUrl: nullableStr(legacy.linkUrl) ?? DEFAULT_SPONSOR.linkUrl,
    altText: str(legacy.altText, DEFAULT_SPONSOR.altText),
  };

  const rawArr = config["mobile.sponsorBanners"];
  const byPlacement = new Map<SponsorPlacementId, Partial<SponsorBannerItem>>();

  if (Array.isArray(rawArr)) {
    for (const item of rawArr) {
      if (item && typeof item === "object" && typeof (item as SponsorBannerItem).placement === "string") {
        const p = (item as SponsorBannerItem).placement;
        if (SPONSOR_PLACEMENTS.some((x) => x.id === p)) {
          byPlacement.set(p, item as Partial<SponsorBannerItem>);
        }
      }
    }
  }

  const hasNew = byPlacement.size > 0;
  return SPONSOR_PLACEMENTS.map((p) =>
    mergeBannerItem(p.id, byPlacement.get(p.id), hasNew ? undefined : legacyCfg),
  );
}

export function mergeMobilePromo(config: Record<string, unknown>): MobilePromoBundle {
  const dev = (config["mobile.developer"] ?? {}) as Record<string, unknown>;
  const rate = (dev.rateApp ?? {}) as Record<string, unknown>;
  const other = (dev.otherApps ?? {}) as Record<string, unknown>;
  const sponsorBanners = mergeSponsorBanners(config);
  const home = sponsorBanners.find((b) => b.placement === "home")!;

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
    sponsorBanners,
    sponsorBanner: {
      enabled: home.enabled,
      imageUrl: home.imageUrl,
      linkUrl: home.linkUrl,
      altText: home.altText,
    },
  };
}

export function mobilePromoToConfigKeys(bundle: MobilePromoBundle): Record<string, unknown> {
  const home = bundle.sponsorBanners.find((b) => b.placement === "home") ?? bundle.sponsorBanners[0];
  return {
    "mobile.developer": bundle.developer,
    "mobile.sponsorBanners": bundle.sponsorBanners,
    "mobile.sponsorBanner": home
      ? {
          enabled: home.enabled,
          imageUrl: home.imageUrl,
          linkUrl: home.linkUrl,
          altText: home.altText,
        }
      : defaultSponsorBanners()[0],
  };
}
