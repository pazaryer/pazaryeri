import React, { useState } from 'react';
import { ImageStyle, StyleProp } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop';

export function resolveImageUri(uri?: string | null): string {
  if (uri && (uri.startsWith('http://') || uri.startsWith('https://'))) return uri;
  return PLACEHOLDER;
}

interface WebImageProps {
  uri?: string | null;
  alt?: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain';
}

/** Tüm platformlarda expo-image — web'de ham <img> CSS hatası önlenir */
export function WebImage({ uri, alt = '', style, contentFit = 'cover' }: WebImageProps) {
  const [failed, setFailed] = useState(false);
  const src = failed ? PLACEHOLDER : resolveImageUri(uri);

  return (
    <ExpoImage
      source={{ uri: src }}
      style={style}
      contentFit={contentFit}
      accessibilityLabel={alt || undefined}
      onError={() => setFailed(true)}
    />
  );
}
