import React from 'react';
import { Platform } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { EmailAuthForm } from '@/components/auth/EmailAuthForm';
import { WebShell } from '@/components/web/WebShell';
import { View } from 'react-native';

export default function EmailAuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();

  if (Platform.OS === 'web') {
    const href = params.mode === 'register' ? '/kayit/eposta' : '/giris/eposta';
    return <Redirect href={href} />;
  }

  const mode = params.mode === 'register' ? 'register' : 'login';

  return (
    <View style={{ flex: 1 }}>
      <EmailAuthForm mode={mode} />
    </View>
  );
}
