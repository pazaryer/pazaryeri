import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { ProfileScreenLayout } from '@/components/ProfileScreenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/lib/hooks';
import { useColors } from '@/hooks/useColors';

export default function SettingsScreen() {
  const colors = useColors();
  const { profile, user, patchProfile } = useAuth();
  const updateProfile = useUpdateProfile();

  const display = profile ?? (user ? { name: user.displayName ?? '', email: user.email, bio: null, city: null } : null);

  const [name, setName] = useState(display?.name ?? '');
  const [city, setCity] = useState(display?.city ?? '');
  const [bio, setBio] = useState(display?.bio ?? '');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (display) {
      setName(display.name ?? '');
      setCity(display.city ?? '');
      setBio(display.bio ?? '');
    }
  }, [display?.name, display?.city, display?.bio]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Ad soyad gerekli');
      return;
    }
    setSaving(true);
    try {
      const saved = await updateProfile.mutateAsync({
        name: name.trim(),
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      patchProfile({
        name: saved.name ?? name.trim(),
        city: saved.city?.trim() || null,
        bio: saved.bio?.trim() || null,
      });
      Alert.alert('Başarılı', 'Profiliniz güncellendi');
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Profil güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileScreenLayout title="Ayarlar">
      <Text style={[styles.label, { color: colors.foreground }]}>Ad Soyad</Text>
      <TextInput
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        value={name}
        onChangeText={setName}
        placeholder="Adınız"
        placeholderTextColor={colors.mutedForeground}
      />

      <Text style={[styles.label, { color: colors.foreground }]}>E-posta</Text>
      <TextInput
        style={[styles.input, styles.readonly, { color: colors.mutedForeground, borderColor: colors.border, backgroundColor: colors.secondary }]}
        value={display?.email ?? ''}
        editable={false}
      />

      <Text style={[styles.label, { color: colors.foreground }]}>Şehir</Text>
      <TextInput
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        value={city}
        onChangeText={setCity}
        placeholder="İstanbul"
        placeholderTextColor={colors.mutedForeground}
      />

      <Text style={[styles.label, { color: colors.foreground }]}>Hakkımda</Text>
      <TextInput
        style={[styles.input, styles.bio, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        value={bio}
        onChangeText={setBio}
        placeholder="Kendinizi tanıtın..."
        placeholderTextColor={colors.mutedForeground}
        multiline
      />

      <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Kaydet</Text>}
      </Pressable>
    </ProfileScreenLayout>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600' },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  readonly: { opacity: 0.8 },
  bio: { height: 96, textAlignVertical: 'top', paddingTop: 12 },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
