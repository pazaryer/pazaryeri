/** Web build için AdMob stub — native modül web'de yüklenmez. */
export const BannerAd = () => null;
export const BannerAdSize = { BANNER: 'BANNER' };
export const InterstitialAd = { createForAdRequest: () => ({ load: () => {}, show: async () => {}, addAdEventListener: () => () => {} }) };
export const RewardedAd = { createForAdRequest: () => ({ load: () => {}, show: async () => {}, addAdEventListener: () => () => {} }) };
export const AdEventType = { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error' };
export const RewardedAdEventType = { LOADED: 'loaded', EARNED_REWARD: 'earned_reward', CLOSED: 'closed' };
export default function mobileAds() {
  return { initialize: async () => {} };
}
