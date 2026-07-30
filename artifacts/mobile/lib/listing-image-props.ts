import type { ImageProps } from 'expo-image';

export const LISTING_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

const baseCache: Pick<ImageProps, 'cachePolicy' | 'allowDownscaling'> = {
  cachePolicy: 'memory-disk',
  allowDownscaling: true,
};

export const listingThumbImageProps: Partial<ImageProps> = {
  ...baseCache,
  transition: 100,
  placeholder: { blurhash: LISTING_BLURHASH },
  priority: 'normal',
};

export const listingHeroImageProps: Partial<ImageProps> = {
  ...baseCache,
  transition: 180,
  priority: 'high',
  placeholder: { blurhash: LISTING_BLURHASH },
};

export const listingGalleryImageProps: Partial<ImageProps> = {
  ...baseCache,
  transition: 120,
  priority: 'high',
};

export const categoryImageProps: Partial<ImageProps> = {
  ...baseCache,
  transition: 80,
  priority: 'high',
};

export const avatarImageProps: Partial<ImageProps> = {
  ...baseCache,
  transition: 100,
  priority: 'low',
};

export const bannerImageProps: Partial<ImageProps> = {
  ...baseCache,
  transition: 150,
  priority: 'low',
};
