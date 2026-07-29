import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useAdMobConfig } from '@/lib/admob/config';
import { apiFetch } from '@/lib/api';
import { BRAND } from '@/constants/brand';

type Props = {
  listingId: string;
  title?: string;
  isPromoted?: boolean;
  promotedUntil?: string | null;
  compact?: boolean;
};

export function ListingPromoteButton({
  listingId,
  title,
  isPromoted,
  promotedUntil,
  compact,
}: Props) {
  const config = useAdMobConfig();
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  if (Platform.OS === 'web' || !config.rewarded.enabled) return null;

  if (isPromoted && promotedUntil) {
    const until = new Date(promotedUntil);
    if (until.getTime() > Date.now()) {
      return (
        <View style={[styles.promotedPill, compact && styles.promotedPillCompact]}>
          <Ionicons name="star" size={14} color={BRAND.gold} />
          <Text style={styles.promotedText}>
            Öne çıkarıldı · {until.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}'a kadar
          </Text>
        </View>
      );
    }
  }

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { showRewardedAdForBoost } = await import('@/lib/admob/rewarded');
      const watched = await showRewardedAdForBoost();
      if (!watched) {
        Alert.alert('Reklam tamamlanmadı', 'İlanı öne çıkarmak için reklamı sonuna kadar izlemeniz gerekir.');
        return;
      }
      await apiFetch<{ success: boolean }>(`/listings/${listingId}/promote`, { method: 'POST' });
      await qc.invalidateQueries({ queryKey: ['listing', listingId] });
      await qc.invalidateQueries({ queryKey: ['listings'] });
      await qc.invalidateQueries({ queryKey: ['my-listings'] });
      Alert.alert(
        'Tebrikler!',
        `İlanınız ${config.rewarded.boostHours} saat boyunca öne çıkarıldı.`,
      );
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Öne çıkarma başarısız');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={() => void onPress()}
      disabled={busy}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[BRAND.primary, BRAND.primaryMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.btn, compact && styles.btnCompact]}
      >
        {busy ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <View style={styles.iconWrap}>
              <Ionicons name="rocket" size={18} color={BRAND.gold} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.btnTitle}>2 Saatliğine Öne Çıkar</Text>
              {!compact && title ? (
                <Text style={styles.btnSub} numberOfLines={1}>
                  {title} · kısa reklam izle
                </Text>
              ) : (
                <Text style={styles.btnSub}>Kısa reklam izle, üst sıralara çık</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
  },
  btnCompact: { paddingVertical: 12 },
  pressed: { opacity: 0.94 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  btnTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  btnSub: { color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 2 },
  promotedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.45)',
  },
  promotedPillCompact: { paddingVertical: 8 },
  promotedText: { color: BRAND.primaryDark, fontSize: 13, fontWeight: '600', flex: 1 },
});
