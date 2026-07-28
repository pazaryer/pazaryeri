import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { ProfileScreenLayout } from '@/components/ProfileScreenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/lib/hooks';
import { useColors } from '@/hooks/useColors';

export default function AddressesScreen() {
  const colors = useColors();
  const { profile, patchProfile } = useAuth();
  const updateProfile = useUpdateProfile();

  const [city, setCity] = useState(profile?.city ?? '');
  const [district, setDistrict] = useState(profile?.district ?? '');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setCity(profile?.city ?? '');
    setDistrict(profile?.district ?? '');
  }, [profile?.city, profile?.district]);

  const handleSave = async () => {
    if (!city.trim()) {
      Alert.alert('Hata', 'Şehir bilgisi gerekli');
      return;
    }
    setSaving(true);
    try {
      const saved = await updateProfile.mutateAsync({
        city: city.trim(),
        district: district.trim() || undefined,
      });
      patchProfile({
        city: saved.city?.trim() || null,
        district: saved.district?.trim() || null,
      });
      Alert.alert('Başarılı', 'Adres bilgileriniz kaydedildi');
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileScreenLayout title="Adreslerim">
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
        İlanlarınızda ve profilinizde gösterilecek şehir ve ilçe bilgilerinizi girin.
      </Text>

      <Text style={[styles.label, { color: colors.foreground }]}>Şehir</Text>
      <TextInput
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        value={city}
        onChangeText={setCity}
        placeholder="İstanbul"
        placeholderTextColor={colors.mutedForeground}
      />

      <Text style={[styles.label, { color: colors.foreground }]}>İlçe</Text>
      <TextInput
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        value={district}
        onChangeText={setDistrict}
        placeholder="Kadıköy"
        placeholderTextColor={colors.mutedForeground}
      />

      <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Kaydet</Text>}
      </Pressable>
    </ProfileScreenLayout>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600' },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
