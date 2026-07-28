import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDeleteListing, useUpdateListingStatus } from '@/lib/hooks';
import { showAlert, showConfirm } from '@/lib/web-alert';

interface ListingOwnerActionsProps {
  listingId: string;
  status: string;
  onDeleted?: () => void;
}

export function ListingOwnerActions({ listingId, status, onDeleted }: ListingOwnerActionsProps) {
  const router = useRouter();
  const updateStatus = useUpdateListingStatus();
  const deleteListing = useDeleteListing();
  const busy = updateStatus.isPending || deleteListing.isPending;

  const runAction = async (label: string, fn: () => Promise<void>) => {
    try {
      await fn();
      if (Platform.OS === 'web') {
        showAlert('Başarılı', label);
      } else {
        Alert.alert('Başarılı', label);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'İşlem başarısız';
      if (Platform.OS === 'web') showAlert('Hata', msg);
      else Alert.alert('Hata', msg);
    }
  };

  const confirmDelete = () => {
    const doDelete = async () => {
      await deleteListing.mutateAsync(listingId);
      onDeleted?.();
    };

    if (Platform.OS === 'web') {
      showConfirm('İlanı Sil', 'Bu ilan kalıcı olarak silinecek. Emin misiniz?', doDelete);
    } else {
      Alert.alert('İlanı Sil', 'Bu ilan kalıcı olarak silinecek. Emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => void doDelete() },
      ]);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>İlan Yönetimi</Text>

      <Pressable
        style={[styles.btn, styles.btnOutline]}
        onPress={() => router.push(`/ilan-duzenle/${listingId}`)}
        disabled={busy}
      >
        <Text style={styles.btnOutlineText}>✏️ Düzenle</Text>
      </Pressable>

      {status === 'active' && (
        <Pressable
          style={[styles.btn, styles.btnSold]}
          disabled={busy}
          onPress={() =>
            runAction('İlan satıldı olarak işaretlendi', () =>
              updateStatus.mutateAsync({ id: listingId, status: 'sold' }),
            )
          }
        >
          {busy ? (
            <ActivityIndicator color="#C62828" />
          ) : (
            <Text style={styles.btnSoldText}>✓ Satıldı Olarak İşaretle</Text>
          )}
        </Pressable>
      )}

      {status === 'sold' && (
        <Pressable
          style={[styles.btn, styles.btnActive]}
          disabled={busy}
          onPress={() =>
            runAction('İlan tekrar yayında', () =>
              updateStatus.mutateAsync({ id: listingId, status: 'active' }),
            )
          }
        >
          {busy ? (
            <ActivityIndicator color="#2E7D32" />
          ) : (
            <Text style={styles.btnActiveText}>↻ Tekrar Yayına Al</Text>
          )}
        </Pressable>
      )}

      <Pressable style={[styles.btn, styles.btnDanger]} onPress={confirmDelete} disabled={busy}>
        <Text style={styles.btnDangerText}>🗑️ İlanı Sil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#1A0A2E', marginBottom: 4 },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnOutline: { borderWidth: 2, borderColor: '#3D1A78', backgroundColor: '#FFF' },
  btnOutlineText: { color: '#3D1A78', fontWeight: '700', fontSize: 15 },
  btnSold: { backgroundColor: '#FFEBEE' },
  btnSoldText: { color: '#C62828', fontWeight: '700', fontSize: 15 },
  btnActive: { backgroundColor: '#E8F5E9' },
  btnActiveText: { color: '#2E7D32', fontWeight: '700', fontSize: 15 },
  btnDanger: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FFCDD2' },
  btnDangerText: { color: '#C62828', fontWeight: '700', fontSize: 15 },
});
