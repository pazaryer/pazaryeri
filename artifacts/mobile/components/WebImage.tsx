import React, { useState } from 'react';
import { ImageStyle, Platform, StyleProp, StyleSheet } from 'react-native';
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

/** Web'de güvenilir <img>, native'de expo-image */
export function WebImage({ uri, alt = '', style, contentFit = 'cover' }: WebImageProps) {
  const [failed, setFailed] = useState(false);
  const src = failed ? PLACEHOLDER : resolveImageUri(uri);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const flat = StyleSheet.flatten(style) ?? {};
    const w = flat.width;
    const h = flat.height;
    return (
      // eslint-disable-next-line jsx-a11y/alt-text
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        style={{
          width: typeof w === 'number' || typeof w === 'string' ? w : '100%',
          height: typeof h === 'number' || typeof h === 'string' ? h : '100%',
          objectFit: contentFit,
          display: 'block',
          borderRadius: typeof flat.borderRadius === 'number' ? flat.borderRadius : undefined,
          backgroundColor: (flat.backgroundColor as string) ?? '#EDE8F5',
        }}
      />
    );
  }

  return (
    <ExpoImage
      source={{ uri: src }}
      style={style}
      contentFit={contentFit}
      onError={() => setFailed(true)}
    />
  );
}
