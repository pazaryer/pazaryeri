/** Google Cloud — Web client 1 (My Project 50208) — TEK OAuth client */

export const FIREBASE_PROJECT_ID = "pazaryeri0";
export const FIREBASE_AUTH_DOMAIN = "pazaryeri0.firebaseapp.com";
export const FIREBASE_WEB_APP_ORIGIN = "https://pazaryeri0.web.app";

/** Google Cloud Console'daki Web client 1 — redirect URI'ler burada kayıtlı */
export const GOOGLE_WEB_CLIENT_ID =
  "637257074433-gr8vbeupacshsv6omfsf60mn5rkef719.apps.googleusercontent.com";

/** Firebase'in kendi client'ı — OAuth için KULLANILMAZ (redirect_uri_mismatch) */
export const FIREBASE_INTERNAL_CLIENT_ID =
  "445495602976-7sqmtkk198ucafhpgsc0girnbvuujh20.apps.googleusercontent.com";

/** Her zaman 637257 — Render'daki yanlış env'i yok say */
export function resolveGoogleWebClientId(): string {
  return GOOGLE_WEB_CLIENT_ID;
}

export const GOOGLE_OAUTH_URIS = {
  javascriptOrigins: [
    FIREBASE_WEB_APP_ORIGIN,
    `https://${FIREBASE_AUTH_DOMAIN}`,
    "http://localhost:8081",
    "http://localhost:19006",
  ],
  redirectUris: [
    "https://pazaryerim.onrender.com/api/auth/google/callback",
    FIREBASE_WEB_APP_ORIGIN,
    `https://${FIREBASE_AUTH_DOMAIN}`,
    `${FIREBASE_WEB_APP_ORIGIN}/oauth/mobile`,
  ],
} as const;
