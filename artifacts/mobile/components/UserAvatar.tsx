import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';

interface UserAvatarProps {
  name: string;
  avatar?: string | null;
  size?: number;
  online?: boolean;
}

export function UserAvatar({ name, avatar, size = 40, online }: UserAvatarProps) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3D1A78&color=fff&size=${size * 2}`;
  const uri = avatar?.startsWith('http') ? avatar : fallback;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {Platform.OS === 'web' && typeof document !== 'undefined' ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img
          src={uri}
          alt={name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallback;
          }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            objectFit: 'cover',
            display: 'block',
            backgroundColor: '#EDE8F5',
          }}
        />
      ) : (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      )}
      {online && (
        <View
          style={[
            styles.dot,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
              right: size * 0.02,
              bottom: size * 0.02,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
