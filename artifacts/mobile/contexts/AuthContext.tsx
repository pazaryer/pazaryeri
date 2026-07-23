import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getFirebaseAuth } from '@/lib/firebase';
import { apiFetch } from '@/lib/api';
import { loadWebProfileExtras } from '@/lib/web-profile';
import { SITE_URL } from '@/lib/config';
import { requestGoogleIdToken } from '@/lib/google-web-signin';

interface UserProfile {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  bio?: string | null;
  city?: string | null;
  district?: string | null;
  rating: number;
  totalSales: number;
  isVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  signInWithGoogleWeb: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  signInWithGooglePopup: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  patchProfile: (patch: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function buildSyncPayload(u: User): Record<string, string> {
  const payload: Record<string, string> = {
    name: (u.displayName?.trim() || 'Kullanıcı').slice(0, 100),
  };
  if (u.email) payload.email = u.email;
  if (u.phoneNumber) payload.phone = u.phoneNumber;
  if (u.photoURL?.startsWith('http')) payload.avatar = u.photoURL;
  return payload;
}

async function applyWebProfileExtras(u: User, base: UserProfile): Promise<UserProfile> {
  if (Platform.OS !== 'web') return base;
  const extras = await loadWebProfileExtras(u.uid);
  return {
    ...base,
    name: extras.name ?? u.displayName?.trim() ?? base.name,
    bio: extras.bio !== undefined ? (extras.bio || null) : base.bio ?? null,
    city: extras.city !== undefined ? (extras.city || null) : base.city ?? null,
    district: extras.district !== undefined ? (extras.district || null) : base.district ?? null,
  };
}

function fallbackProfile(u: User): UserProfile {
  return {
    id: u.uid,
    name: u.displayName?.trim() || 'Kullanıcı',
    email: u.email,
    phone: u.phoneNumber,
    avatar: u.photoURL,
    rating: 0,
    totalSales: 0,
    isVerified: false,
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const syncingRef = useRef<string | null>(null);

  const syncProfile = useCallback(async (u: User) => {
    if (syncingRef.current === u.uid) return;
    syncingRef.current = u.uid;

    try {
      await u.getIdToken(true);
      const p = await apiFetch<UserProfile>('/users/sync', {
        method: 'POST',
        body: JSON.stringify(buildSyncPayload(u)),
      });
      setProfile(await applyWebProfileExtras(u, p));

      if (Platform.OS !== 'web' && Constants.appOwnership !== 'expo') {
        const { registerForPushNotifications } = await import('@/lib/notifications');
        registerForPushNotifications().catch(() => null);
      }
    } catch {
      const base = fallbackProfile(u);
      setProfile(await applyWebProfileExtras(u, base));
      try {
        const p = await apiFetch<UserProfile>('/users/me');
        setProfile(await applyWebProfileExtras(u, p));
      } catch {
        setProfile(await applyWebProfileExtras(u, fallbackProfile(u)));
      }
    } finally {
      syncingRef.current = null;
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();

    if (Platform.OS === 'web') {
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) syncProfile(result.user);
        })
        .catch(() => null);
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        syncProfile(u);
      } else {
        setProfile(null);
        syncingRef.current = null;
      }
      setIsLoading(false);
    });
    return unsub;
  }, [syncProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
    const { updateProfile } = await import('firebase/auth');
    await updateProfile(cred.user, { displayName: name.trim() });
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim(), {
      url: `${SITE_URL.replace(/\/$/, '')}/login`,
      handleCodeInApp: false,
    });
  };

  const signInWithGoogleIdToken = async (idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(getFirebaseAuth(), credential);
  };

  const signInWithGoogleRedirect = async () => {
    if (Platform.OS !== 'web') {
      throw new Error('Mobil için native Google girişi kullanın');
    }
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithRedirect(auth, provider);
  };

  const signInWithGooglePopup = async () => {
    if (Platform.OS !== 'web') {
      throw new Error('Mobil için native Google girişi kullanın');
    }
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  const signInWithGoogleWeb = async () => {
    if (Platform.OS !== 'web') {
      throw new Error('Mobil için native Google girişi kullanın');
    }
    const idToken = await requestGoogleIdToken();
    await signInWithGoogleIdToken(idToken);
  };

  const signOut = async () => {
    await firebaseSignOut(getFirebaseAuth());
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    await user.reload();
    let base: UserProfile;
    try {
      base = await apiFetch<UserProfile>('/users/me');
    } catch {
      base = fallbackProfile(user);
    }
    setProfile(await applyWebProfileExtras(user, base));
  };

  const patchProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signInWithGoogleIdToken,
        signInWithGoogleWeb,
        signInWithGoogleRedirect,
        signInWithGooglePopup,
        signOut,
        refreshProfile,
        patchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
