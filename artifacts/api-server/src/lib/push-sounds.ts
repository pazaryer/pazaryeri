const PUSH_SOUND_BY_TYPE: Record<string, string> = {
  message: 'pazaryeri_message.wav',
  favorite: 'pazaryeri_favorite.wav',
  favorite_update: 'pazaryeri_favorite.wav',
  engagement: 'pazaryeri_push.wav',
  offer: 'pazaryeri_push.wav',
  review: 'pazaryeri_push.wav',
  admin_new_listing: 'pazaryeri_push.wav',
  admin_new_user: 'pazaryeri_push.wav',
  admin_new_report: 'pazaryeri_message.wav',
  default: 'pazaryeri_push.wav',
};

export function getPushSoundForType(type?: string): string {
  if (!type) return PUSH_SOUND_BY_TYPE.default;
  return PUSH_SOUND_BY_TYPE[type] ?? PUSH_SOUND_BY_TYPE.default;
}
