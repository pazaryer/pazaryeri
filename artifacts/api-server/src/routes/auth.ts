import { Router, type IRouter } from "express";
import crypto from "crypto";
import { z } from "zod/v4";
import { AppError } from "../middleware/errorHandler";

const router: IRouter = Router();

const SITE_PUBLIC_URL =
  process.env.SITE_PUBLIC_URL ?? "https://pazaryeri0.web.app";

const API_PUBLIC_URL =
  process.env.API_PUBLIC_URL ?? "https://pazaryerim.onrender.com";

const DEFAULT_WEB_CLIENT_ID =
  "637257074433-gr8vbeupacshsv6omnfsf60mn5rkef719.apps.googleusercontent.com";

function siteUrl(path: string): string {
  const base = SITE_PUBLIC_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function apiCallbackUrl(): string {
  const base = API_PUBLIC_URL.replace(/\/$/, "");
  return `${base}/api/auth/google/callback`;
}

function isAllowedReturnUrl(url: string): boolean {
  return (
    url.startsWith("https://auth.expo.io/") || url.startsWith("pazaryeri://")
  );
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

function generatePkce() {
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(
    crypto.createHash("sha256").update(verifier).digest(),
  );
  return { verifier, challenge };
}

function encodeOAuthState(returnUrl: string, verifier: string): string {
  return b64url(JSON.stringify({ returnUrl, verifier }));
}

function decodeOAuthState(
  state: string,
): { returnUrl: string; verifier: string } | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as { returnUrl?: string; verifier?: string };
    if (!parsed.returnUrl || !parsed.verifier) return null;
    if (!isAllowedReturnUrl(parsed.returnUrl)) return null;
    return { returnUrl: parsed.returnUrl, verifier: parsed.verifier };
  } catch {
    return null;
  }
}

async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<string> {
  const clientId = process.env.GOOGLE_WEB_CLIENT_ID ?? DEFAULT_WEB_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const params: Record<string, string> = {
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };
  if (codeVerifier) params.code_verifier = codeVerifier;
  if (clientSecret) params.client_secret = clientSecret;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  const data = (await tokenRes.json()) as {
    id_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!data.id_token) {
    const detail =
      data.error_description ?? data.error ?? "Google token alınamadı";
    throw new AppError(
      `${detail}. Redirect URI: ${redirectUri}`,
      400,
    );
  }

  return data.id_token;
}

function redirectWithToken(returnUrl: string, idToken: string) {
  const sep = returnUrl.includes("?") ? "&" : "?";
  return `${returnUrl}${sep}id_token=${encodeURIComponent(idToken)}`;
}

function redirectWithError(returnUrl: string, error: string) {
  const sep = returnUrl.includes("?") ? "&" : "?";
  return `${returnUrl}${sep}error=${encodeURIComponent(error)}`;
}

/**
 * Expo Go / mobil — tek seferlik Google OAuth (redirect döngüsü yok).
 * GET /api/auth/google/start?return=https://auth.expo.io/@owner/slug
 */
router.get("/auth/google/start", (req, res) => {
  const returnUrl = String(req.query.return ?? "");
  if (!isAllowedReturnUrl(returnUrl)) {
    res.status(400).send("Geçersiz return URL");
    return;
  }

  const { verifier, challenge } = generatePkce();
  const state = encodeOAuthState(returnUrl, verifier);
  const clientId = process.env.GOOGLE_WEB_CLIENT_ID ?? DEFAULT_WEB_CLIENT_ID;
  const redirectUri = apiCallbackUrl();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
    access_type: "online",
  });

  res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

/** Google OAuth callback — id_token ile uygulamaya döner */
router.get("/auth/google/callback", async (req, res) => {
  const stateRaw = String(req.query.state ?? "");
  const decoded = decodeOAuthState(stateRaw);
  const fallbackReturn = decoded?.returnUrl ?? "pazaryeri://auth";

  try {
    const oauthError = req.query.error;
    if (oauthError) {
      res.redirect(
        302,
        redirectWithError(fallbackReturn, String(oauthError)),
      );
      return;
    }

    const code = String(req.query.code ?? "");
    if (!decoded || !code) {
      res.status(400).send("Geçersiz OAuth yanıtı");
      return;
    }

    const idToken = await exchangeGoogleCode(
      code,
      apiCallbackUrl(),
      decoded.verifier,
    );
    res.redirect(302, redirectWithToken(decoded.returnUrl, idToken));
  } catch (err) {
    const msg =
      err instanceof AppError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Google girişi başarısız";
    res.redirect(302, redirectWithError(fallbackReturn, msg));
  }
});

/** Mobil Google giriş — API OAuth akışına yönlendir */
router.get("/auth/google/mobile", (req, res) => {
  const appRedirect = String(req.query.app_redirect ?? "");
  if (isAllowedReturnUrl(appRedirect)) {
    const start = `${API_PUBLIC_URL.replace(/\/$/, "")}/api/auth/google/start?return=${encodeURIComponent(appRedirect)}`;
    res.redirect(302, start);
    return;
  }
  res.redirect(302, siteUrl("/giris"));
});

const exchangeSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
  codeVerifier: z.string().min(1).optional(),
});

/** Mobil — authorization code → id_token (PKCE) */
router.post("/auth/google/exchange", async (req, res, next) => {
  try {
    const { code, redirectUri, codeVerifier } = exchangeSchema.parse(req.body);
    const idToken = await exchangeGoogleCode(code, redirectUri, codeVerifier);
    res.json({ idToken });
  } catch (err) {
    next(err);
  }
});

export default router;
