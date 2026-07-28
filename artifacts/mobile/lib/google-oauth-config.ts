/**
 * Google Cloud — Web client 1 (My Project 50208)
 */
import Constants from 'expo-constants';

export const FIREBASE_PROJECT_ID = 'pazaryeri0';
export const FIREBASE_AUTH_DOMAIN = 'pazaryeri0.firebaseapp.com';
export const FIREBASE_WEB_APP_ORIGIN = 'https://pazaryeri0.web.app';

export const GOOGLE_WEB_CLIENT_ID =
  '637257074433-gr8vbeupacshsv6omfsf60mn5rkef719.apps.googleusercontent.com';

export function resolveGoogleWebClientId(): string {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (fromEnv?.includes('.apps.googleusercontent.com')) {
    return fromEnv;
  }
  const fromExtra = Constants.expoConfig?.extra?.google?.webClientId?.trim();
  if (fromExtra?.includes('.apps.googleusercontent.com')) {
    return fromExtra;
  }
  return GOOGLE_WEB_CLIENT_ID;
}

export const GOOGLE_OAUTH_URIS = {
  javascriptOrigins: [
    FIREBASE_WEB_APP_ORIGIN,
    `https://${FIREBASE_AUTH_DOMAIN}`,
    'http://localhost:8081',
    'http://localhost:19006',
  ],
  redirectUris: [
    'https://pazaryerim.onrender.com/api/auth/google/callback',
    'https://auth.expo.io/@pazaryeri/pazaryeri',
    'https://auth.expo.io/pazaryeri',
    'pazaryeri://auth',
    FIREBASE_WEB_APP_ORIGIN,
    `https://${FIREBASE_AUTH_DOMAIN}`,
    `${FIREBASE_WEB_APP_ORIGIN}/oauth/mobile`,
    `${FIREBASE_WEB_APP_ORIGIN}/oauth/app-return`,
  ],
} as const;
