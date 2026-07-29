import React from 'react';
import { Platform } from 'react-native';
import { SponsorBanner } from '@/components/SponsorBanner';

/** Sponsor banner — mobilde tüm sayfalarda tab bar üstünde görünür. */
export function AppOverlays() {
  if (Platform.OS === 'web') return null;

  return <SponsorBanner variant="floating" />;
}
