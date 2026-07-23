import React from 'react';
import { View, Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { WebShell } from '@/components/web/WebShell';
import { EmailAuthForm } from '@/components/auth/EmailAuthForm';

export default function GirisEpostaScreen() {
  if (Platform.OS !== 'web') {
    return <Redirect href="/email-auth" />;
  }

  return (
    <WebShell hideFooter>
      <View style={{ maxWidth: 480, width: '100%', alignSelf: 'center', padding: 24, flex: 1 }}>
        <EmailAuthForm mode="login" />
      </View>
    </WebShell>
  );
}
