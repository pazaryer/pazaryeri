import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { renderGoogleSignInButton } from '@/lib/google-web-signin';

interface GoogleSignInButtonProps {
  buttonId?: string;
  onCredential: (idToken: string) => void;
  onError: (error: Error) => void;
}

export function GoogleSignInButton({
  buttonId = 'pazaryeri-google-signin-btn',
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const cleanup = renderGoogleSignInButton(buttonId, onCredential, onError);
    return cleanup;
  }, [buttonId, onCredential, onError]);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.wrap}>
      {/* @ts-expect-error web only */}
      <div id={buttonId} className="google-signin-host" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', minHeight: 48, alignItems: 'center' },
});
