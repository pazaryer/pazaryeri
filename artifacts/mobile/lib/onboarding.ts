import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'pz_onboarding_done_v1';

let memoryDone: boolean | null = null;
const listeners = new Set<(done: boolean) => void>();

function notify(done: boolean) {
  listeners.forEach((listener) => listener(done));
}

export function subscribeOnboarding(listener: (done: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function isOnboardingComplete(): Promise<boolean> {
  if (memoryDone !== null) return memoryDone;
  try {
    const v = await AsyncStorage.getItem(ONBOARDING_KEY);
    memoryDone = v === '1';
  } catch {
    memoryDone = false;
  }
  return memoryDone;
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, '1');
  memoryDone = true;
  notify(true);
}
