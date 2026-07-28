import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { isPostgresConfigured, pgHealthCheck } from "../lib/postgres-db";
import { getImageStorageStatus } from "../lib/image-storage";
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_OAUTH_URIS,
  resolveGoogleWebClientId,
} from "../lib/google-oauth-config";

const router: IRouter = Router();

const API_PUBLIC_URL =
  process.env.API_PUBLIC_URL ?? "https://pazaryerim.onrender.com";

router.get("/healthz", async (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  const dbOk = isPostgresConfigured() ? await pgHealthCheck() : null;
  res.json({
    ...data,
    db: dbOk,
    dbMode: dbOk ? "postgres" : "supabase",
    storage: getImageStorageStatus(),
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
