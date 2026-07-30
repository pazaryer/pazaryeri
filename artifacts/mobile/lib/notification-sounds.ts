import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export type InAppSoundKind = 'popup' | 'favorite' | 'message';

const SOUND_FILES: Record<InAppSoundKind, ReturnType<typeof require>> = {
  popup: require('@/assets/sounds/pazaryeri_inapp.wav'),
  favorite: require('@/assets/sounds/pazaryeri_favorite.wav'),
  message: require('@/assets/sounds/pazaryeri_message.wav'),
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
  if (Platform.OS === 'web') return;
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
  message: 'pazaryeri_message.wav',
  favorite: 'pazaryeri_favorite.wav',
  favorite_update: 'pazaryeri_favorite.wav',
  engagement: 'pazaryeri_push.wav',
  offer: 'pazaryeri_push.wav',
  review: 'pazaryeri_push.wav',
  default: 'pazaryeri_push.wav',
};

export function getPushSoundForType(type?: string): string {
  if (!type) return PUSH_SOUND_BY_TYPE.default;
  return PUSH_SOUND_BY_TYPE[type] ?? PUSH_SOUND_BY_TYPE.default;
}
