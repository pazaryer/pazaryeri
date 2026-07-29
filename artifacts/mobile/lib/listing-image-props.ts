import type { ImageProps } from 'expo-image';

export const LISTING_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export const listingThumbImageProps: Partial<ImageProps> = {
  cachePolicy: 'memory-disk',
  transition: 200,
  placeholder: { blurhash: LISTING_BLURHASH },
};

export const listingHeroImageProps: Partial<ImageProps> = {
  cachePolicy: 'memory-disk',
  transition: 250,
  priority: 'high',
  placeholder: { blurhash: LISTING_BLURHASH },
};

export const listingGalleryImageProps: Partial<ImageProps> = {
  cachePolicy: 'memory-disk',
  transition: 150,
  priority: 'high',
};
