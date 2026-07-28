import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { LocationFilterBar } from '@/components/LocationFilterBar';
import { useWebLocation } from '@/contexts/WebLocationContext';
import { WEB_THEME } from '@/lib/web-theme';

export function WebLocationPicker() {
  const { pickerOpen, closePicker, filter, setFilter, clearFilter } = useWebLocation();

  const apply = async (v: Parameters<typeof setFilter>[0]) => {
    await setFilter(v);
  };

  if (Platform.OS !== 'web' && !pickerOpen) return null;

  return (
    <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={closePicker}>
      <Pressable style={styles.backdrop} onPress={closePicker}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Konum Seç</Text>
          <Text style={styles.hint}>Yakınındaki ilanları görmek için konum ayarla</Text>
          <LocationFilterBar
            value={filter}
            onChange={(v) => {
              void apply(v);
            }}
          />
          <View style={styles.actions}>
            <Pressable
              style={styles.clearBtn}
              onPress={() => {
                clearFilter();
                closePicker();
              }}
            >
              <Text style={styles.clearText}>Sıfırla</Text>
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={closePicker}>
              <Text style={styles.doneText}>Tamam</Text>
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
    backgroundColor: 'rgba(26, 10, 46, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 12,
    paddingBottom: 20,
    shadowColor: '#3D1A78',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8E0F4',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: WEB_THEME.brand,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: WEB_THEME.textMuted,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WEB_THEME.border,
    alignItems: 'center',
  },
  clearText: { fontSize: 14, fontWeight: '600', color: WEB_THEME.textMuted },
  doneBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: WEB_THEME.brand,
    alignItems: 'center',
  },
  doneText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
