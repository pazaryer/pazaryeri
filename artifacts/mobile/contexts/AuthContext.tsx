import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';
import { getFirebaseAuth } from '@/lib/firebase';
import { apiFetch } from '@/lib/api';
import { registerForPushNotifications } from '@/lib/notifications';

WebBrowser.maybeCompleteAuthSession();

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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [, , promptGoogle] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  const syncProfile = useCallback(async (u: User) => {
    try {
      const p = await apiFetch<UserProfile>('/users/sync', {
        method: 'POST',
        body: JSON.stringify({
          name: u.displayName ?? 'Kullanıcı',
          email: u.email,
          phone: u.phoneNumber,
          avatar: u.photoURL,
        }),
      });
      setProfile(p);
      registerForPushNotifications();
    } catch {
      // API may not be ready yet
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) syncProfile(u);
      else setProfile(null);
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
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  };

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();

    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return;
    }

    const result = await promptGoogle();
    if (result?.type !== 'success') {
      throw new Error('Google girişi iptal edildi');
    }

    const idToken = result.params.id_token;
    if (!idToken) {
      throw new Error('Google token alınamadı');
    }

    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
  };

  const signOut = async () => {
    await firebaseSignOut(getFirebaseAuth());
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await apiFetch<UserProfile>('/users/me');
    setProfile(p);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signInWithGoogle,
        signOut,
        refreshProfile,
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
