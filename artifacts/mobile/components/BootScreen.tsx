import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { BRAND } from '@/constants/brand';
import { AppIcon } from '@/components/AppIcon';

/** Font/auth/onboarding yüklenirken siyah ekran yerine gösterilir */
export function BootScreen() {
  return (
    <View style={styles.wrap}>
      <AppIcon size="hero" variant="splash" />
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primary,
    gap: 20,
  },
});
