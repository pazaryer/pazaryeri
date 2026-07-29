import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMobileDeveloper } from '@/lib/remote-config';
import { useColors } from '@/hooks/useColors';
import { DevByAltunBadge } from '@/components/DevByAltunBadge';

function resolveRateUrl(
  rate: { androidUrl: string | null; iosUrl: string | null; webUrl: string | null },
): string | null {
  if (Platform.OS === 'android') return rate.androidUrl;
  if (Platform.OS === 'ios') return rate.iosUrl ?? rate.androidUrl;
  return rate.webUrl ?? rate.androidUrl;
}

export function DeveloperActions() {
  const colors = useColors();
  const dev = getMobileDeveloper();

  if (!dev.enabled) return null;

  const rateUrl = resolveRateUrl(dev.rateApp);
  const showRate = dev.rateApp.enabled && rateUrl;
  const showOther = dev.otherApps.enabled && dev.otherApps.url;

  if (!showRate && !showOther) {
    return <DevByAltunBadge compact />;
  }

  const openUrl = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <View style={styles.wrap}>
      {showRate ? (
        <Pressable
          style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.primary }]}
          onPress={() => openUrl(rateUrl!)}
        >
          <Ionicons name="star" size={18} color="#FFF" />
          <Text style={styles.btnTextPrimary}>{dev.rateApp.label}</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
        </Pressable>
      ) : null}

      {showOther ? (
        <Pressable
          style={[styles.btn, styles.btnOutline, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => openUrl(dev.otherApps.url!)}
        >
          <Ionicons name="apps-outline" size={18} color={colors.primary} />
          <Text style={[styles.btnTextOutline, { color: colors.foreground }]}>{dev.otherApps.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </Pressable>
      ) : null}

      <DevByAltunBadge compact />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnPrimary: {
    shadowColor: '#3D1A78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnOutline: {
    borderWidth: 1,
  },
  btnTextPrimary: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnTextOutline: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
