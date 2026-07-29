import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenLayout } from '@/components/ProfileScreenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/lib/hooks';
import { useColors } from '@/hooks/useColors';
import { pickImages } from '@/lib/storage';
import { DevByAltunBadge } from '@/components/DevByAltunBadge';

export default function SettingsScreen() {
  const colors = useColors();
  const { profile, user, patchProfile, deleteAccount } = useAuth();
  const updateProfile = useUpdateProfile();

  const display = profile ?? (user ? { name: user.displayName ?? '', email: user.email, bio: null, city: null, phone: null, avatar: user.photoURL } : null);

  const [name, setName] = useState(display?.name ?? '');
  const [phone, setPhone] = useState(display?.phone ?? '');
  const [city, setCity] = useState(display?.city ?? '');
  const [bio, setBio] = useState(display?.bio ?? '');
  const [avatar, setAvatar] = useState(display?.avatar ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    if (display) {
      setName(display.name ?? '');
      setPhone(display.phone ?? '');
      setCity(display.city ?? '');
      setBio(display.bio ?? '');
      setAvatar(display.avatar ?? '');
    }
  }, [display?.name, display?.phone, display?.city, display?.bio, display?.avatar]);

  const handlePickAvatar = async () => {
    try {
      setUploading(true);
      const urls = await pickImages(1);
      if (urls[0]) setAvatar(urls[0]);
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Fotoğraf seçilemedi');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Ad soyad gerekli');
      return;
    }
    setSaving(true);
    try {
      const saved = await updateProfile.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: avatar || undefined,
      });
      patchProfile({
        name: saved.name ?? name.trim(),
        phone: phone.trim() || null,
        city: saved.city?.trim() || city.trim() || null,
        bio: saved.bio?.trim() || bio.trim() || null,
        avatar: avatar || saved.avatar || null,
      });
      Alert.alert('Başarılı', 'Profiliniz güncellendi');
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Profil güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Kalıcı Sil',
      'Tüm ilanlarınız, mesajlarınız, yorumlarınız ve profiliniz kalıcı olarak silinecek. Bu işlem geri alınamaz. Google Play ve gizlilik kurallarına uygun şekilde verileriniz sunucudan kaldırılır.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabımı Sil',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Emin misiniz?', 'Son kez onaylayın — hesap tamamen silinecek.', [
              { text: 'İptal', style: 'cancel' },
              {
                text: 'Evet, Sil',
                style: 'destructive',
                onPress: async () => {
                  setDeleting(true);
                  try {
                    await deleteAccount();
                    Alert.alert('Hesap Silindi', 'Hesabınız ve verileriniz kaldırıldı.');
                  } catch (e: unknown) {
                    Alert.alert(
                      'Hata',
                      e instanceof Error
                        ? e.message
                        : 'Hesap silinemedi. Son girişinizden çok zaman geçtiyse çıkış yapıp tekrar giriş yapın.',
                    );
                  } finally {
                    setDeleting(false);
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  const avatarUri =
    avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'K')}&background=3D1A78&color=fff`;

  return (
    <ProfileScreenLayout title="Profil Ayarları">
      <Pressable style={styles.avatarSection} onPress={handlePickAvatar}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        <View style={[styles.avatarEdit, { backgroundColor: colors.primary }]}>
          {uploading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="camera" size={16} color="#FFF" />
          )}
        </View>
        <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>Fotoğrafı değiştir</Text>
      </Pressable>

      <Text style={[styles.label, { color: colors.foreground }]}>Ad Soyad</Text>
      <TextInput
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        value={name}
        onChangeText={setName}
        placeholder="Adınız"
        placeholderTextColor={colors.mutedForeground}
      />

      <Text style={[styles.label, { color: colors.foreground }]}>Telefon</Text>
      <TextInput
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        value={phone}
        onChangeText={setPhone}
        placeholder="05XX XXX XX XX"
        placeholderTextColor={colors.mutedForeground}
        keyboardType="phone-pad"
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

      <View style={[styles.dangerZone, { borderColor: colors.destructive }]}>
        <Text style={[styles.dangerTitle, { color: colors.destructive }]}>Tehlikeli Bölge</Text>
        <Text style={[styles.dangerHint, { color: colors.mutedForeground }]}>
          Hesabınızı silerseniz ilanlar, mesajlar ve tüm kişisel veriler kalıcı olarak kaldırılır.
        </Text>
        <Pressable
          style={[styles.deleteBtn, { borderColor: colors.destructive }]}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color={colors.destructive} />
          ) : (
            <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Hesabımı Kalıcı Sil</Text>
          )}
        </Pressable>
      </View>

      <DevByAltunBadge compact />
    </ProfileScreenLayout>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', marginBottom: 20, gap: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarEdit: {
    position: 'absolute',
    top: 68,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarHint: { fontSize: 12 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12 },
  input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, marginTop: 6 },
  readonly: { opacity: 0.8 },
  bio: { height: 96, textAlignVertical: 'top', paddingTop: 12 },
  button: { height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  dangerZone: {
    marginTop: 40,
    marginBottom: 24,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(180, 35, 24, 0.06)',
  },
  dangerTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  dangerHint: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  deleteBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 15, fontWeight: '700' },
});
