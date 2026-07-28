import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Linking, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { ProfileScreenLayout } from '@/components/ProfileScreenLayout';
import { useColors } from '@/hooks/useColors';

const STORAGE_KEY = 'pz_notification_prefs';

type Prefs = {
  messages: boolean;
  listings: boolean;
  offers: boolean;
};

const DEFAULT_PREFS: Prefs = { messages: true, listings: true, offers: true };

export default function NotificationsScreen() {
  const colors = useColors();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      })
      .catch(() => null);
  }, []);

  const updatePref = async (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const openSystemSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:').catch(() =>
        Alert.alert('Bilgi', 'Ayarlar → Pazaryeri → Bildirimler bölümünden açabilirsiniz'),
      );
    } else {
      Linking.openSettings().catch(() =>
        Alert.alert('Bilgi', 'Telefon ayarlarından Pazaryeri bildirimlerini açabilirsiniz'),
      );
    }
  };

  return (
    <ProfileScreenLayout title="Bildirimler">
      {isExpoGo && (
        <View style={[styles.note, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
            Expo Go'da anlık bildirimler sınırlıdır. Tam bildirim desteği için mağaza sürümünü kullanın.
          </Text>
        </View>
      )}

      <ToggleRow
        title="Mesajlar"
        subtitle="Yeni mesaj geldiğinde bildir"
        value={prefs.messages}
        onChange={(v) => updatePref('messages', v)}
        colors={colors}
      />
      <ToggleRow
        title="İlanlarım"
        subtitle="İlan görüntülenme ve durum güncellemeleri"
        value={prefs.listings}
        onChange={(v) => updatePref('listings', v)}
        colors={colors}
      />
      <ToggleRow
        title="Teklifler"
        subtitle="İlanınıza teklif geldiğinde bildir"
        value={prefs.offers}
        onChange={(v) => updatePref('offers', v)}
        colors={colors}
      />

      <Pressable
        style={[styles.systemBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={openSystemSettings}
      >
        <Text style={[styles.systemBtnText, { color: colors.primary }]}>Telefon Bildirim Ayarlarını Aç</Text>
      </Pressable>
    </ProfileScreenLayout>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  colors,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#D1C4E9', true: '#C9A84C' }}
        thumbColor={value ? '#3D1A78' : '#f4f3f4'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  noteText: { fontSize: 13, lineHeight: 19 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 2 },
  systemBtn: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  systemBtnText: { fontSize: 15, fontWeight: '600' },
});
