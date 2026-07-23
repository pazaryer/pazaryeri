import Constants from 'expo-constants';

/**
 * Firebase projesi pazaryeri0 (445495602976) web client ID.
 * GIS id_token → signInWithCredential ile uyumlu olmalı.
 */
export const FIREBASE_GOOGLE_WEB_CLIENT_ID =
  '445495602976-7sqmtkk198ucafhpgsc0girnbvuujh20.apps.googleusercontent.com';

export function resolveGoogleWebClientId(): string {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (fromEnv?.includes('.apps.googleusercontent.com')) {
    // Yanlış proje client ID'sini engelle (637257... Firebase ile uyumsuz)
    if (fromEnv.startsWith('637257074433-')) {
      return FIREBASE_GOOGLE_WEB_CLIENT_ID;
    }
    return fromEnv;
  }

  const fromExtra = Constants.expoConfig?.extra?.google?.webClientId?.trim();
  if (fromExtra?.includes('.apps.googleusercontent.com')) {
    if (fromExtra.startsWith('637257074433-')) {
      return FIREBASE_GOOGLE_WEB_CLIENT_ID;
    }
    return fromExtra;
  }

  return FIREBASE_GOOGLE_WEB_CLIENT_ID;
}

/** @deprecated resolveGoogleWebClientId kullanın */
export const GOOGLE_WEB_CLIENT_ID = FIREBASE_GOOGLE_WEB_CLIENT_ID;
