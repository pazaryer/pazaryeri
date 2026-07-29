import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type InAppSoundKind = 'popup' | 'favorite' | 'message';

const SOUND_FILES: Record<InAppSoundKind, ReturnType<typeof require>> = {
  popup: require('@/assets/sounds/pazaryeri-inapp.wav'),
  favorite: require('@/assets/sounds/pazaryeri-favorite.wav'),
  message: require('@/assets/sounds/pazaryeri-message.wav'),
};

let audioModeReady = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady || Platform.OS === 'web') return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: 1,
      interruptionModeIOS: 1,
    });
    audioModeReady = true;
  } catch {
    /* ignore */
  }
}

/** Uygulama içi popup/toast sesi */
export async function playInAppNotificationSound(kind: InAppSoundKind = 'popup'): Promise<void> {
  if (Platform.OS === 'web' || Constants.appOwnership === 'expo') return;
  try {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(SOUND_FILES[kind], {
      shouldPlay: true,
      volume: 0.9,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync();
      }
    });
  } catch {
    /* ignore */
  }
}

export const PUSH_SOUND_BY_TYPE: Record<string, string> = {
  message: 'pazaryeri-message.wav',
  favorite: 'pazaryeri-favorite.wav',
  favorite_update: 'pazaryeri-favorite.wav',
  engagement: 'pazaryeri-push.wav',
  offer: 'pazaryeri-push.wav',
  review: 'pazaryeri-push.wav',
  default: 'pazaryeri-push.wav',
};

export function getPushSoundForType(type?: string): string {
  if (!type) return PUSH_SOUND_BY_TYPE.default;
  return PUSH_SOUND_BY_TYPE[type] ?? PUSH_SOUND_BY_TYPE.default;
}
