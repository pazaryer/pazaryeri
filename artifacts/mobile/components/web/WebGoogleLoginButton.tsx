import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';

interface WebGoogleLoginButtonProps {
  onPress: () => void;
  loading?: boolean;
  label?: string;
}

export function WebGoogleLoginButton({
  onPress,
  loading,
  label = 'Google ile devam et',
}: WebGoogleLoginButtonProps) {
  return (
    <Pressable
      style={[styles.btn, loading && styles.disabled]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#3D1A78" />
      ) : (
        <>
          <Text style={styles.icon}>G</Text>
          <Text style={styles.text}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E8E0F4',
    backgroundColor: '#FFFFFF',
    width: '100%',
    minHeight: 48,
  },
  disabled: { opacity: 0.7 },
  icon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#EA4335',
    width: 22,
    textAlign: 'center',
  },
  text: { fontSize: 14, fontWeight: '700', color: '#1A0A2E' },
});
