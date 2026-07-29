export const SPONSOR_PLACEMENTS = [
  { id: 'home', label: 'Ana Sayfa' },
  { id: 'explore', label: 'Keşfet' },
  { id: 'post', label: 'İlan Ver' },
  { id: 'messages', label: 'Mesajlar' },
  { id: 'profile', label: 'Profil' },
  { id: 'listing', label: 'İlan Detay' },
  { id: 'web', label: 'Web Sitesi' },
] as const;

export type SponsorPlacementId = (typeof SPONSOR_PLACEMENTS)[number]['id'];

export type SponsorBannerItem = {
  placement: SponsorPlacementId;
  enabled: boolean;
  imageUrl: string | null;
  linkUrl: string | null;
  altText: string;
};
