import { DEFAULT_APP_CONFIG } from "./app-config-defaults";

export type WebAppDownloadConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  buttonText: string;
  androidStoreUrl: string;
  iosStoreUrl: string;
  androidDeepLink: string;
  iosDeepLink: string;
  showOnDesktop: boolean;
};

const DEFAULT = DEFAULT_APP_CONFIG["web.appDownload"] as WebAppDownloadConfig;

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function mergeWebAppDownload(config: Record<string, unknown>): WebAppDownloadConfig {
  const raw = (config["web.appDownload"] ?? {}) as Record<string, unknown>;
  return {
    enabled: bool(raw.enabled, DEFAULT.enabled),
    title: str(raw.title, DEFAULT.title),
    subtitle: str(raw.subtitle, DEFAULT.subtitle),
    buttonText: str(raw.buttonText, DEFAULT.buttonText),
    androidStoreUrl: str(raw.androidStoreUrl, DEFAULT.androidStoreUrl),
    iosStoreUrl: str(raw.iosStoreUrl, DEFAULT.iosStoreUrl),
    androidDeepLink: str(raw.androidDeepLink, DEFAULT.androidDeepLink),
    iosDeepLink: str(raw.iosDeepLink, DEFAULT.iosDeepLink),
    showOnDesktop: bool(raw.showOnDesktop, DEFAULT.showOnDesktop),
  };
}
