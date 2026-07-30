import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export type AdminSoundKind = 'alert' | 'report';

const SOUND_FILES: Record<AdminSoundKind, ReturnType<typeof require>> = {
  alert: require('@/assets/sounds/pazaryeri_push.wav'),
  report: require('@/assets/sounds/pazaryeri_message.wav'),
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

export async function playAdminNotificationSound(kind: AdminSoundKind = 'alert'): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(SOUND_FILES[kind], {
      shouldPlay: true,
      volume: 1,
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

export function soundKindForAdminType(type: string): AdminSoundKind {
  return type === 'admin_new_report' ? 'report' : 'alert';
}
