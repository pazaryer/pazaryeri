import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { renderGoogleSignInButton } from '@/lib/google-web-signin';

interface WebGoogleLoginButtonProps {
  loading?: boolean;
  onCredential: (idToken: string) => void;
  onError: (message: string) => void;
  style?: ViewStyle;
}

/** Web — Google'ın resmi butonu (GIS), redirect_uri gerektirmez */
export function WebGoogleLoginButton({
  loading,
  onCredential,
  onError,
  style,
}: WebGoogleLoginButtonProps) {
  const containerId = useRef(`google-btn-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    const cleanup = renderGoogleSignInButton(
      containerId,
      onCredential,
      (err) => onError(err.message),
    );
    return cleanup;
  }, [containerId, onCredential, onError]);

  if (loading) {
    return (
      <View style={[styles.wrap, style]}>
        <ActivityIndicator color="#3D1A78" />
      </View>
    );
  }

  return (
    <View
      // @ts-expect-error web className
      className="google-signin-host"
      nativeID={containerId}
      style={[styles.wrap, style]}
      accessibilityRole="button"
      accessibilityLabel="Google ile devam et"
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
