import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import { BRAND, SUPPORT_EMAIL } from '@/constants/brand';
import { LISTING_CATEGORIES } from './categories';

export type RemoteAppConfig = {
  brand?: Partial<typeof BRAND> & {
    name?: string;
    tagline?: string;
    supportEmail?: string;
    assets?: {
      iconUrl?: string | null;
      logoUrl?: string | null;
      splashUrl?: string | null;
      faviconUrl?: string | null;
      ogImageUrl?: string | null;
      adaptiveIconUrl?: string | null;
    };
  };
  'web.seo'?: Record<string, string>;
  'web.announcements'?: unknown[];
  'mobile.categories'?: string[];
  'mobile.featureFlags'?: {
    enableOffers?: boolean;
    enableComments?: boolean;
    enablePush?: boolean;
    enableLocationFilter?: boolean;
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
  };
  'mobile.app'?: {
    name?: string;
    version?: string;
    minSupportedVersion?: string;
    forceUpdate?: boolean;
    updateMessage?: string;
  };
  'mobile.developer'?: {
    enabled?: boolean;
    signatureLabel?: string;
    rateApp?: {
      enabled?: boolean;
      label?: string;
      androidUrl?: string | null;
      iosUrl?: string | null;
      webUrl?: string | null;
    };
    otherApps?: {
      enabled?: boolean;
      label?: string;
      url?: string | null;
    };
  };
  'mobile.sponsorBanner'?: {
    enabled?: boolean;
    imageUrl?: string | null;
    linkUrl?: string | null;
    altText?: string;
  };
  'mobile.admob'?: import('@/lib/admob/config').AdMobRemoteConfig;
};

let cached: RemoteAppConfig | null = null;
let fetchedAt = 0;
const TTL_MS = 60_000;

const listeners = new Set<() => void>();

function notifyRemoteConfigListeners(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeRemoteConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Config değişince bileşenleri yeniden render etmek için. */
export function useRemoteConfigVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeRemoteConfig(() => setVersion((v) => v + 1)), []);
  return version;
}

export async function fetchRemoteConfig(force = false): Promise<RemoteAppConfig> {
  const now = Date.now();
  if (!force && cached && now - fetchedAt < TTL_MS) return cached;
  try {
    const res = await apiFetch<{ config: RemoteAppConfig }>('/config');
    cached = res.config ?? {};
    fetchedAt = now;
    notifyRemoteConfigListeners();
    return cached;
  } catch {
    return cached ?? {};
  }
}

export function getCachedRemoteConfig(): RemoteAppConfig {
  return cached ?? {};
}

export function getRemoteCategories(fallback: readonly string[] = LISTING_CATEGORIES): string[] {
  const remote = cached?.['mobile.categories'];
  return remote?.length ? remote : [...fallback];
}

export function getRemoteBrand() {
  const remote = cached?.brand;
  if (!remote) return { ...BRAND, supportEmail: SUPPORT_EMAIL };
  return {
    ...BRAND,
    ...remote,
    supportEmail: remote.supportEmail ?? SUPPORT_EMAIL,
  };
}

export function isMaintenanceMode(): { active: boolean; message: string } {
  const flags = cached?.['mobile.featureFlags'];
  return {
    active: flags?.maintenanceMode ?? false,
    message: flags?.maintenanceMessage ?? 'Bakım çalışması yapılıyor.',
  };
}

const DEFAULT_DEVELOPER = {
  enabled: true,
  signatureLabel: 'dev/ByAltun',
  rateApp: {
    enabled: true,
    label: 'Uygulamayı Puanla & Yorumla',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.pazaryerim',
    iosUrl: null as string | null,
    webUrl: 'https://play.google.com/store/apps/details?id=com.pazaryerim',
  },
  otherApps: {
    enabled: true,
    label: 'Yapımcının Diğer Uygulamaları',
    url: 'https://play.google.com/store/apps/developer?id=By+Altun',
  },
};

const DEFAULT_SPONSOR = {
  enabled: false,
  imageUrl: null as string | null,
  linkUrl: null as string | null,
  altText: 'Sponsor',
};

export function getMobileDeveloper() {
  const d = cached?.['mobile.developer'];
  if (!d) return DEFAULT_DEVELOPER;
  return {
    enabled: d.enabled ?? DEFAULT_DEVELOPER.enabled,
    signatureLabel: d.signatureLabel ?? DEFAULT_DEVELOPER.signatureLabel,
    rateApp: {
      enabled: d.rateApp?.enabled ?? DEFAULT_DEVELOPER.rateApp.enabled,
      label: d.rateApp?.label ?? DEFAULT_DEVELOPER.rateApp.label,
      androidUrl: d.rateApp?.androidUrl ?? DEFAULT_DEVELOPER.rateApp.androidUrl,
      iosUrl: d.rateApp?.iosUrl ?? DEFAULT_DEVELOPER.rateApp.iosUrl,
      webUrl: d.rateApp?.webUrl ?? DEFAULT_DEVELOPER.rateApp.webUrl,
    },
    otherApps: {
      enabled: d.otherApps?.enabled ?? DEFAULT_DEVELOPER.otherApps.enabled,
      label: d.otherApps?.label ?? DEFAULT_DEVELOPER.otherApps.label,
      url: d.otherApps?.url ?? DEFAULT_DEVELOPER.otherApps.url,
    },
  };
}

export function getSponsorBanner() {
  const s = cached?.['mobile.sponsorBanner'];
  if (!s) return DEFAULT_SPONSOR;
  return {
    enabled: s.enabled ?? DEFAULT_SPONSOR.enabled,
    imageUrl: s.imageUrl ?? DEFAULT_SPONSOR.imageUrl,
    linkUrl: s.linkUrl ?? DEFAULT_SPONSOR.linkUrl,
    altText: s.altText ?? DEFAULT_SPONSOR.altText,
  };
}

export function useSponsorBanner() {
  useRemoteConfigVersion();
  return getSponsorBanner();
}

export function useMobileDeveloper() {
  useRemoteConfigVersion();
  return getMobileDeveloper();
}
