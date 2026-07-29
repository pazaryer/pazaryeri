/** Firebase web config (public). Env vars override at build time. */
export const FIREBASE_WEB_CONFIG = {
  apiKey: 'AIzaSyB6W3BBz1_SpD-jp8dcpvFTjeBwnZlw4Dg',
  authDomain: 'pazaryeri0.firebaseapp.com',
  projectId: 'pazaryeri0',
  storageBucket: 'pazaryeri0.firebasestorage.app',
  messagingSenderId: '445495602976',
  appId: '1:445495602976:web:a9d405b30d0cab7d85f145',
  measurementId: 'G-X4KF641X5R',
} as const;

/** Firebase Web Push VAPID key (Cloud Messaging → Web configuration) */
export const FIREBASE_VAPID_KEY =
  'BCCbTdV1OncqfM7ophTNgoQLhjPeHQWiY5O_u_nmAnWwWTAOeOR6_rtVSs-W2IofkIU5M9uU29MLuX8XIqXqNkM';
