import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import { useAdMobConfig } from '@/lib/admob/config';
import { apiFetch } from '@/lib/api';
import { BRAND } from '@/constants/brand';
import { formatPrice, type ListingSummary } from '@/lib/hooks';

type Props = {
  listings: ListingSummary[];
};

export function ListingBoostSection({ listings }: Props) {
  const config = useAdMobConfig();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const activeListings = listings.filter((l) => l.status === 'active');

  if (Platform.OS === 'web' || !config.rewarded.enabled || activeListings.length === 0) {
    return null;
  }

  const runBoost = async (item: ListingSummary) => {
    setPickerOpen(false);
    Alert.alert(
      'İlanı Öne Çıkar',
      `"${item.title}" ilanını ${config.rewarded.boostHours} saat öne çıkarmak istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Öne Çıkar',
          onPress: () => void confirmBoost(item),
        },
      ],
    );
  };

  const confirmBoost = async (item: ListingSummary) => {
    if (busy) return;
    setBusy(true);
    try {
      const { showRewardedAdForBoost } = await import('@/lib/admob/rewarded');
      const watched = await showRewardedAdForBoost();
      if (!watched) {
        Alert.alert('Reklam tamamlanmadı', 'İlanı öne çıkarmak için reklamı sonuna kadar izlemeniz gerekir.');
        return;
      }
      await apiFetch<{ success: boolean }>(`/listings/${item.id}/promote`, { method: 'POST' });
      await qc.invalidateQueries({ queryKey: ['listing', item.id] });
      await qc.invalidateQueries({ queryKey: ['listings'] });
      await qc.invalidateQueries({ queryKey: ['my-listings'] });
      await qc.refetchQueries({ queryKey: ['listings', 'featured'] });

      try {
        const { maybeShowBoostInterstitial } = await import('@/lib/admob/interstitial');
        await maybeShowBoostInterstitial();
      } catch {
        /* öne çıkarma başarılı — interstitial hatası yutulur */
      }

      Alert.alert(
        'Tebrikler!',
        `"${item.title}" ilanı ${config.rewarded.boostHours} saat boyunca öne çıkarıldı.`,
      );
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Öne çıkarma başarısız');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>İlanlarını Öne Çıkar</Text>
      <Text style={styles.sub}>Kısa reklam izleyerek ilanını üst sıralarda tut</Text>

      <Pressable onPress={() => setPickerOpen(true)} disabled={busy}>
        <LinearGradient
          colors={[BRAND.primary, BRAND.primaryMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mainBtn}
        >
          {busy ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="rocket" size={20} color={BRAND.gold} />
              <Text style={styles.mainBtnText}>İlan Seç ve Öne Çıkar</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
            </>
          )}
        </LinearGradient>
      </Pressable>

      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Hangi ilanı öne çıkarmak istiyorsunuz?</Text>
            <ScrollView style={styles.list}>
              {activeListings.map((item) => (
                <Pressable key={item.id} style={styles.row} onPress={() => void runBoost(item)}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]}>
                      <Ionicons name="image-outline" size={22} color="#999" />
                    </View>
                  )}
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowPrice}>{formatPrice(item.price)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.cancelBtn} onPress={() => setPickerOpen(false)}>
              <Text style={styles.cancelText}>İptal</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#1A0A2E' },
  sub: { fontSize: 13, color: '#7A6B8A', marginBottom: 4 },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
  },
  mainBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 28,
    maxHeight: '70%',
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#1A0A2E', marginBottom: 12 },
  list: { maxHeight: 360 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
  },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#F0F0F0' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#1A0A2E' },
  rowPrice: { fontSize: 13, fontWeight: '700', color: BRAND.primary },
  cancelBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#7A6B8A' },
});
