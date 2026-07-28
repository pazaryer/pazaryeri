import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

const STORAGE_KEY = 'pz_device_id';
let cached: string | null = null;

function generateUuid(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export async function getDeviceId(): Promise<string> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = generateUuid();
        localStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    }
    return 'web-anonymous';
  }

  if (cached) return cached;
  let id = await AsyncStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateUuid();
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }
  cached = id;
  return id;
}
