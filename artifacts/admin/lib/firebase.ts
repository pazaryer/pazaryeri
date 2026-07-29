import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
// @ts-expect-error RN persistence path (Firebase v11)
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from './firebase.config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(FIREBASE_CONFIG);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const existing = getApps().length ? getApps()[0]! : getFirebaseApp();
    try {
      auth = initializeAuth(existing, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      auth = getAuth(existing);
    }
  }
  return auth;
}
