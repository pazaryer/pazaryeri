import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  type Auth,
} from 'firebase/auth';
import { initAnalytics } from './analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { FIREBASE_WEB_CONFIG, FIREBASE_VAPID_KEY } from './firebase.config';

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

export function getFirebaseVapidKey(): string {
  const fromEnv = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY;
  if (fromEnv) return fromEnv;
  const extra = getExtraFirebase() as { vapidKey?: string };
  return extra.vapidKey ?? FIREBASE_VAPID_KEY;
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

export function getFirebaseWebConfig() {
  return { ...firebaseConfig };
}

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

export function initFirebase(): FirebaseApp | null {
  if (app && auth) return app;

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[Pazaryeri] Firebase yapılandırması eksik');
    return null;
  }

  try {
    app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
    auth = initAuthInstance(app);

    if (Constants.platform?.web) {
      void initAnalytics();
    }

    return app;
  } catch (err) {
    console.error('[Pazaryeri] Firebase başlatılamadı:', err);
    return null;
  }
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const initialized = initFirebase();
    if (!initialized || !auth) {
      throw new Error('Firebase Auth kullanılamıyor');
    }
  }
  return auth;
}
