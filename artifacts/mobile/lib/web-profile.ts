import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Platform } from 'react-native';
import { getFirebaseAuth, initFirebase } from './firebase';
import { apiFetch } from './api';

export type WebProfileData = {
  name?: string;
  bio?: string;
  city?: string;
  district?: string;
};

function profileStorageKey(uid: string) {
  return `pz_profile_${uid}`;
}

function saveLocalProfile(uid: string, data: WebProfileData) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(
    profileStorageKey(uid),
    JSON.stringify({
      name: data.name ?? null,
      bio: data.bio ?? null,
      city: data.city ?? null,
      district: data.district ?? null,
      updatedAt: Date.now(),
    }),
  );
}

function loadLocalProfile(uid: string): Partial<WebProfileData> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(profileStorageKey(uid));
    if (!raw) return {};
    const d = JSON.parse(raw) as Record<string, unknown>;
    return {
      name: typeof d.name === 'string' ? d.name : undefined,
      bio: typeof d.bio === 'string' ? d.bio : d.bio === null ? '' : undefined,
      city: typeof d.city === 'string' ? d.city : d.city === null ? '' : undefined,
      district: typeof d.district === 'string' ? d.district : undefined,
    };
  } catch {
    return {};
  }
}

function db() {
  initFirebase();
  return getFirestore();
}

export async function updateWebProfile(data: WebProfileData): Promise<WebProfileData> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Giriş gerekli');

  const saved: WebProfileData = {
    name: data.name?.trim() || user.displayName || 'Kullanıcı',
    bio: data.bio?.trim() ?? '',
    city: data.city?.trim() ?? '',
    district: data.district?.trim() ?? '',
  };

  if (data.name?.trim()) {
    await updateProfile(user, { displayName: data.name.trim() });
    await user.reload();
  }

  saveLocalProfile(user.uid, saved);

  if (Platform.OS === 'web') {
    try {
      await setDoc(
        doc(db(), 'profiles', user.uid),
        {
          name: saved.name,
          bio: saved.bio || null,
          city: saved.city || null,
          district: saved.district || null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch {
      // localStorage yeterli
    }
  }

  try {
    await apiFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify({
        name: saved.name,
        bio: saved.bio || undefined,
        city: saved.city || undefined,
        district: saved.district || undefined,
      }),
    });
  } catch {
    // API arka planda
  }

  return saved;
}

export async function loadWebProfileExtras(uid: string): Promise<Partial<WebProfileData>> {
  if (Platform.OS !== 'web') return {};

  const local = loadLocalProfile(uid);
  if (Object.keys(local).length > 0) {
    return local;
  }

  try {
    const snap = await getDoc(doc(db(), 'profiles', uid));
    if (!snap.exists()) return {};
    const d = snap.data();
    return {
      bio: typeof d.bio === 'string' ? d.bio : undefined,
      city: typeof d.city === 'string' ? d.city : undefined,
      district: typeof d.district === 'string' ? d.district : undefined,
      name: typeof d.name === 'string' ? d.name : undefined,
    };
  } catch {
    return local;
  }
}
