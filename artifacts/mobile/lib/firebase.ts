import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  type Auth,
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { FIREBASE_WEB_CONFIG } from './firebase.config';

type FirebaseExtra = Partial<typeof FIREBASE_WEB_CONFIG>;

function getExtraFirebase(): FirebaseExtra {
  return (Constants.expoConfig?.extra?.firebase as FirebaseExtra | undefined) ?? {};
}

function cfg(key: keyof typeof FIREBASE_WEB_CONFIG): string {
  const envKey = `EXPO_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}` as string;
  const fromEnv = process.env[envKey as keyof NodeJS.ProcessEnv];
  if (fromEnv) return fromEnv;
  const extra = getExtraFirebase();
  return extra[key] ?? FIREBASE_WEB_CONFIG[key];
}

const firebaseConfig = {
  apiKey: cfg('apiKey'),
  authDomain: cfg('authDomain'),
  projectId: cfg('projectId'),
  storageBucket: cfg('storageBucket'),
  messagingSenderId: cfg('messagingSenderId'),
  appId: cfg('appId'),
  measurementId: cfg('measurementId'),
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function initAuthInstance(firebaseApp: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence, initializeAuth } = require('firebase/auth');
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    throw e;
  }
}

export function initFirebase(): FirebaseApp {
  if (app && auth) return app;

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase yapılandırması eksik. app.json veya .env kontrol edin.');
  }

  app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
  auth = initAuthInstance(app);

  if (Constants.platform?.web) {
    isSupported().then((supported) => {
      if (supported) getAnalytics(app!);
    });
  }

  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) initFirebase();
  if (!auth) {
    throw new Error('Firebase Auth başlatılamadı');
  }
  return auth;
}
