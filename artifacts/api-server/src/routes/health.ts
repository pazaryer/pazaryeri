import { Router, type IRouter } from "express";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getImageStorageStatus } from "../lib/image-storage";
import { getListingsDbStatus } from "../lib/listings-store";
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_OAUTH_URIS,
  resolveGoogleWebClientId,
} from "../lib/google-oauth-config";
import { mergeAdMobConfig } from "../lib/mobile-admob";
import { isAdMobProductionReady } from "../lib/admob-env";
import { getAppConfig } from "../lib/app-config";

const router: IRouter = Router();

const API_PUBLIC_URL =
  process.env.API_PUBLIC_URL ?? "https://pazaryerim.onrender.com";

const SITE_PUBLIC_URL =
  process.env.SITE_PUBLIC_URL ?? "https://pazaryeri0.web.app";

function readAssetLinksFingerprints(): string[] {
  const candidates = [
    join(process.cwd(), "artifacts/mobile/public/.well-known/assetlinks.json"),
    join(process.cwd(), "public/.well-known/assetlinks.json"),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    try {
      const raw = JSON.parse(readFileSync(p, "utf8")) as Array<{
        target?: { sha256_cert_fingerprints?: string[] };
      }>;
      const fps = raw[0]?.target?.sha256_cert_fingerprints ?? [];
      return fps.filter(Boolean);
    } catch {
      /* ignore */
    }
  }
  const fromEnv = process.env.ANDROID_SHA256_FINGERPRINTS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return fromEnv ?? [];
}

router.get("/healthz", async (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  const listingsDb = await getListingsDbStatus();
  const fcmReady = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
  const imgbbReady = getImageStorageStatus().ok;
  let admobReady = false;
  try {
    const admob = mergeAdMobConfig(await getAppConfig());
    admobReady = isAdMobProductionReady(admob);
  } catch {
    admobReady = false;
  }
  const deepLinkFingerprints = readAssetLinksFingerprints();

  res.json({
    ...data,
    db: listingsDb.backend !== "none",
    dbMode: listingsDb.backend,
    listingsDb,
    storage: getImageStorageStatus(),
    readiness: {
      push: {
        fcmServiceAccount: fcmReady,
        expoPush: true,
        ready: fcmReady,
      },
      admob: {
        productionIds: admobReady,
        ready: admobReady,
      },
      deepLinks: {
        assetlinksFingerprints: deepLinkFingerprints.length,
        ready: deepLinkFingerprints.length > 0,
        siteUrl: SITE_PUBLIC_URL,
      },
      images: { imgbb: imgbbReady, ready: imgbbReady },
    },
    google: {
      clientId: resolveGoogleWebClientId(),
      expectedClientId: GOOGLE_WEB_CLIENT_ID,
      secretConfigured: Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()),
      callback: `${API_PUBLIC_URL.replace(/\/$/, "")}/api/auth/google/callback`,
      redirectUris: GOOGLE_OAUTH_URIS.redirectUris,
      setupUrl: `${API_PUBLIC_URL.replace(/\/$/, "")}/api/auth/google/setup`,
    },
  });
});

export default router;
