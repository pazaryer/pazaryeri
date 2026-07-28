import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import { apiFetch } from './api';

export type MobileProfileData = {
  name?: string;
  bio?: string;
  city?: string;
  district?: string;
};

function profileStorageKey(uid: string) {
  return `pz_profile_${uid}`;
}

async function saveLocalProfile(uid: string, data: MobileProfileData) {
  await AsyncStorage.setItem(
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

export async function loadMobileProfileExtras(uid: string): Promise<Partial<MobileProfileData>> {
  try {
    const raw = await AsyncStorage.getItem(profileStorageKey(uid));
    if (!raw) return {};
    const d = JSON.parse(raw) as Record<string, unknown>;
    return {
      name: typeof d.name === 'string' ? d.name : undefined,
      bio: typeof d.bio === 'string' ? d.bio : d.bio === null ? '' : undefined,
      city: typeof d.city === 'string' ? d.city : d.city === null ? '' : undefined,
      district: typeof d.district === 'string' ? d.district : d.district === null ? '' : undefined,
    };
  } catch {
    return {};
  }
}

export async function updateMobileProfile(data: MobileProfileData): Promise<MobileProfileData> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Giriş gerekli');

  const saved: MobileProfileData = {
    name: data.name?.trim() || user.displayName || 'Kullanıcı',
    bio: data.bio?.trim() ?? '',
    city: data.city?.trim() ?? '',
    district: data.district?.trim() ?? '',
  };

  if (data.name?.trim()) {
    await updateProfile(user, { displayName: data.name.trim() });
    await user.reload();
  }

  await saveLocalProfile(user.uid, saved);

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
    // API geçici olarak kapalıysa yerel kayıt yeterli
  }

  return saved;
}
