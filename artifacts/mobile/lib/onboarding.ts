import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'pz_onboarding_done_v1';

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(ONBOARDING_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, '1');
}
