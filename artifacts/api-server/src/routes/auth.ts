import { Router, type IRouter, type Request } from "express";
import { AppError } from "../middleware/errorHandler";

const router: IRouter = Router();

function getGoogleClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID ??
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    ""
  );
}

function getGoogleClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET ?? "";
}

function getPublicUrl(req: Request): string {
  if (process.env.API_PUBLIC_URL) {
    return process.env.API_PUBLIC_URL.replace(/\/$/, "");
  }
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  const host = req.get("x-forwarded-host") ?? req.get("host");
  return `${proto}://${host}`;
}

function encodeState(appRedirect: string): string {
  return Buffer.from(JSON.stringify({ appRedirect }), "utf8").toString("base64url");
}

function decodeState(state: string): { appRedirect: string } {
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      appRedirect?: string;
    };
    if (!parsed.appRedirect?.startsWith("pazaryeri://")) {
      throw new Error("invalid redirect");
    }
    return { appRedirect: parsed.appRedirect };
  } catch {
    throw new AppError("Geçersiz OAuth state", 400);
  }
}

router.get("/auth/google/mobile", (req, res) => {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) {
    res.status(503).json({
      error: "Google OAuth yapılandırılmamış (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)",
    });
    return;
  }

  const appRedirect = String(req.query.app_redirect ?? "");
  if (!appRedirect.startsWith("pazaryeri://")) {
    res.status(400).json({ error: "Geçersiz app_redirect" });
    return;
  }

  const callbackUri = `${getPublicUrl(req)}/api/auth/google/callback`;
  const state = encodeState(appRedirect);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get("/auth/google/callback", async (req, res, next) => {
  try {
    const clientId = getGoogleClientId();
    const clientSecret = getGoogleClientSecret();
    if (!clientId || !clientSecret) {
      throw new AppError("Google OAuth yapılandırılmamış", 503);
    }

    const oauthError = req.query.error;
    const state = String(req.query.state ?? "");
    let appRedirect = "pazaryeri://auth";
    try {
      appRedirect = decodeState(state).appRedirect;
    } catch {
      // state decode failed
    }

    if (oauthError) {
      res.redirect(
        `${appRedirect}?error=${encodeURIComponent(String(oauthError))}`,
      );
      return;
    }

    const code = req.query.code;
    if (!code || typeof code !== "string") {
      res.redirect(`${appRedirect}?error=missing_code`);
      return;
    }

    const callbackUri = `${getPublicUrl(req)}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = (await tokenRes.json()) as {
      id_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenRes.ok || !tokens.id_token) {
      const msg = tokens.error_description ?? tokens.error ?? "token_exchange_failed";
      res.redirect(`${appRedirect}?error=${encodeURIComponent(msg)}`);
      return;
    }

    res.redirect(`${appRedirect}?id_token=${encodeURIComponent(tokens.id_token)}`);
  } catch (err) {
    next(err);
  }
});

export default router;
