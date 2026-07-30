import { SignJWT, importPKCS8 } from "jose";
import { logger } from "./logger";
import { getPushSoundForType } from "./push-sounds";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

let cachedToken: { token: string; expires: number } | null = null;

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    logger.warn("FIREBASE_SERVICE_ACCOUNT_JSON geçersiz");
    return null;
  }
}

async function getFcmAccessToken(): Promise<string | null> {
  const sa = getServiceAccount();
  if (!sa?.client_email || !sa.private_key) return null;

  const now = Date.now();
  if (cachedToken && cachedToken.expires > now + 60_000) {
    return cachedToken.token;
  }

  try {
    const iat = Math.floor(now / 1000);
    const jwt = await new SignJWT({
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(sa.client_email)
      .setSubject(sa.client_email)
      .setAudience("https://oauth2.googleapis.com/token")
      .setIssuedAt(iat)
      .setExpirationTime(iat + 3600)
      .sign(await importPKCS8(sa.private_key.replace(/\\n/g, "\n"), "RS256"));

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!res.ok) return null;
    const body = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!body.access_token) return null;

    cachedToken = {
      token: body.access_token,
      expires: now + (body.expires_in ?? 3600) * 1000,
    };
    return body.access_token;
  } catch (err) {
    logger.warn({ err }, "FCM access token alınamadı");
    return null;
  }
}

export function isFcmToken(token: string): boolean {
  return token.startsWith("fcm:");
}

export function stripFcmPrefix(token: string): string {
  return token.startsWith("fcm:") ? token.slice(4) : token;
}

function resolveChannelId(type?: string): string {
  if (!type) return "default";
  if (type.startsWith("admin_")) return "default";
  if (type === "engagement") return "engagement";
  if (type === "message") return "messages";
  if (type === "favorite" || type === "favorite_update") return "favorites";
  return "default";
}

function androidSoundName(soundFile: string): string {
  return soundFile.replace(/\.wav$/i, "");
}

export async function sendFcmNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  options?: { badge?: number; type?: string; channelId?: string; sound?: string },
): Promise<boolean> {
  const accessToken = await getFcmAccessToken();
  if (!accessToken) return false;

  const sa = getServiceAccount();
  const projectId = sa?.project_id ?? process.env.FIREBASE_PROJECT_ID ?? "pazaryeri0";
  const fcmToken = stripFcmPrefix(token);
  const notifType = options?.type ?? data?.type ?? "default";
  const channelId = options?.channelId ?? resolveChannelId(notifType);
  const soundFile = options?.sound ?? getPushSoundForType(notifType);
  const soundName = androidSoundName(soundFile);

  const stringData = Object.fromEntries(
    Object.entries({ ...(data ?? {}), type: notifType }).map(([k, v]) => [k, String(v)]),
  );

  const message: Record<string, unknown> = {
    token: fcmToken,
    notification: { title, body },
    data: stringData,
    android: {
      priority: "HIGH",
      notification: {
        channel_id: channelId,
        sound: soundName,
        default_vibrate_timings: true,
        notification_priority: "PRIORITY_HIGH",
        visibility: "PUBLIC",
      },
    },
    webpush: {
      fcmOptions: { link: "https://pazaryeri0.web.app/notifications" },
      notification: {
        icon: "https://pazaryeri0.web.app/favicon.ico",
        badge: "https://pazaryeri0.web.app/favicon.ico",
      },
    },
  };

  if (options?.badge != null) {
    (message as { apns?: Record<string, unknown> }).apns = {
      payload: { aps: { badge: options.badge } },
    };
  }

  try {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      logger.warn({ status: res.status, errText }, "FCM send failed");
      if (errText.includes("UNREGISTERED") || errText.includes("NOT_FOUND")) {
        return false;
      }
      return false;
    }
    return true;
  } catch (err) {
    logger.warn({ err }, "FCM send error");
    return false;
  }
}
