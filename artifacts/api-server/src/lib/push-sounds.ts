const PUSH_SOUND_BY_TYPE: Record<string, string> = {
  message: "pazaryeri-message.wav",
  favorite: "pazaryeri-favorite.wav",
  favorite_update: "pazaryeri-favorite.wav",
  engagement: "pazaryeri-push.wav",
  offer: "pazaryeri-push.wav",
  review: "pazaryeri-push.wav",
  default: "pazaryeri-push.wav",
};

export function getPushSoundForType(type?: string): string {
  if (!type) return PUSH_SOUND_BY_TYPE.default;
  return PUSH_SOUND_BY_TYPE[type] ?? PUSH_SOUND_BY_TYPE.default;
}
