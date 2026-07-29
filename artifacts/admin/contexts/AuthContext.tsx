import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { getFirebaseAuth } from '@/lib/firebase';
import { authFetch, getBootstrapAdminEmails } from '@/lib/api';

export interface AdminProfile {
  id: string;
  name: string;
  email: string | null;
  role: 'moderator' | 'admin';
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: AdminProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = 'pazaryeri_admin_session';

async function syncUser(u: User): Promise<void> {
  await authFetch('/users/sync', {
    method: 'POST',
    body: JSON.stringify({
      name: (u.displayName?.trim() || u.email?.split('@')[0] || 'Admin').slice(0, 100),
      email: u.email ?? '',
    }),
  });
}

async function verifyAdminAccess(u: User): Promise<AdminProfile> {
  try {
    return await authFetch<AdminProfile>('/admin/me');
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (!msg.includes('404') && !msg.includes('bulunamadı')) throw e;

    const me = await authFetch<{
      id: string;
      name: string;
      email?: string | null;
      avatar?: string | null;
      role?: string;
    }>('/users/me');

    const role = me.role as string | undefined;
    if (role === 'admin' || role === 'moderator') {
      return {
        id: me.id,
        name: me.name,
        email: me.email ?? null,
        role: role as 'admin' | 'moderator',
        avatar: me.avatar ?? null,
      };
    }

    const bootstrap = getBootstrapAdminEmails();
    const email = (me.email ?? u.email ?? '').toLowerCase();
    if (bootstrap.length > 0 && bootstrap.includes(email)) {
      return {
        id: me.id,
        name: me.name,
        email: me.email ?? null,
        role: 'admin',
        avatar: me.avatar ?? null,
      };
    }

    throw new Error(
      'Admin yetkisi yok. Supabase\'de role=admin yapın veya API\'yi deploy edin.',
    );
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async (firebaseUser?: User | null) => {
    const u = firebaseUser ?? getFirebaseAuth().currentUser;
    if (!u) throw new Error('Oturum yok');
    await syncUser(u);
    const p = await verifyAdminAccess(u);
    setProfile(p);
    await SecureStore.setItemAsync(SESSION_KEY, '1');
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
        setIsLoading(false);
        return;
      }
      try {
        await refreshProfile(u);
      } catch {
        setProfile(null);
        await firebaseSignOut(auth);
        await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
      } finally {
        setIsLoading(false);
      }
    });
    return unsub;
  }, [refreshProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      try {
        await refreshProfile(cred.user);
      } catch (e) {
        await firebaseSignOut(auth);
        throw e;
      }
    },
    [refreshProfile],
  );

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
    await firebaseSignOut(getFirebaseAuth());
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signIn, signOut, refreshProfile: () => refreshProfile() }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
