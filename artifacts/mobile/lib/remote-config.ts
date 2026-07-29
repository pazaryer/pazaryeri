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
};

let cached: RemoteAppConfig | null = null;
let fetchedAt = 0;
const TTL_MS = 60_000;

export async function fetchRemoteConfig(force = false): Promise<RemoteAppConfig> {
  const now = Date.now();
  if (!force && cached && now - fetchedAt < TTL_MS) return cached;
  try {
    const res = await apiFetch<{ config: RemoteAppConfig }>('/config');
    cached = res.config ?? {};
    fetchedAt = now;
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
