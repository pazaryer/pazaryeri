import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

const STORAGE_KEY = 'pz_device_id';
let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = Crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    }
    return 'web-anonymous';
  }

  if (cached) return cached;
  let id = await AsyncStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }
  cached = id;
  return id;
}
