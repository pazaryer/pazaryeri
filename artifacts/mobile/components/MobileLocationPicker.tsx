import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  LocationFilterBar,
  type LocationFilterBarHandle,
  type LocationFilterValue,
} from '@/components/LocationFilterBar';
import { useMobileLocation } from '@/contexts/MobileLocationContext';
import { BRAND } from '@/constants/brand';

export function MobileLocationPicker() {
  const insets = useSafeAreaInsets();
  const { pickerOpen, closePicker, filter, setFilter, clearFilter, refreshCoords } = useMobileLocation();
  const [draft, setDraft] = useState<LocationFilterValue>(filter);
  const barRef = useRef<LocationFilterBarHandle>(null);

  useEffect(() => {
    if (pickerOpen) {
      setDraft(filter);
      void refreshCoords();
    }
  }, [pickerOpen, filter, refreshCoords]);

  const handleSave = async () => {
    const next = barRef.current?.commitPending() ?? draft;
    await setFilter(next);
    closePicker();
  };

  const handleReset = async () => {
    setDraft({});
    await clearFilter();
    closePicker();
  };

  return (
    <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={closePicker}>
      <Pressable style={styles.backdrop} onPress={closePicker}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <Ionicons name="location" size={18} color={BRAND.primary} />
            </View>
            <View style={styles.titleText}>
              <Text style={styles.title}>Konum Seç</Text>
              <Text style={styles.hint}>Seçiminiz kaydedilir, her açılışta korunur</Text>
            </View>
            <Pressable onPress={closePicker} hitSlop={10}>
              <Ionicons name="close" size={22} color={BRAND.textMuted} />
            </Pressable>
          </View>
          <LocationFilterBar ref={barRef} value={draft} onChange={setDraft} />
          <View style={styles.actions}>
            <Pressable style={styles.resetBtn} onPress={() => void handleReset()}>
              <Text style={styles.resetText}>Türkiye (Tümü)</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={() => void handleSave()}>
              <Text style={styles.saveText}>Kaydet</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 10, 46, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    shadowColor: '#3D1A78',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: BRAND.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: BRAND.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: BRAND.text },
  hint: { fontSize: 12, color: BRAND.textMuted, marginTop: 2, lineHeight: 17 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
  },
  resetText: { fontSize: 14, fontWeight: '600', color: BRAND.textMuted },
  saveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
  },
  saveText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
