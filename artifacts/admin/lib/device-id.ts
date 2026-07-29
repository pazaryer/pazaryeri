import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pz_admin_device_id';
let cached: string | null = null;

function generateUuid(): string {
  return `admin-${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

export async function getAdminDeviceId(): Promise<string> {
  if (cached) return cached;
  let id = await AsyncStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateUuid();
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }
  cached = id;
  return id;
}
