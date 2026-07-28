import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenLayout } from '@/components/ProfileScreenLayout';
import { useColors } from '@/hooks/useColors';

const FAQ = [
  {
    q: 'Nasıl ilan veririm?',
    a: 'Alt menüden "İlan Ver" sekmesine gidin, fotoğraf ekleyin ve bilgileri doldurun.',
  },
  {
    q: 'İlanımı nasıl düzenlerim?',
    a: 'İlan detay sayfasında sahip olduğunuz ilanlarda düzenleme seçenekleri görünür.',
  },
  {
    q: 'Mesajlaşma nasıl çalışır?',
    a: 'Bir ilana tıklayıp satıcıya mesaj gönderebilirsiniz. Mesajlarınız "Mesajlar" sekmesinde görünür.',
  },
  {
    q: 'Hesabımı nasıl silerim?',
    a: 'destek@pazaryeri.app adresine e-posta göndererek hesap silme talebinde bulunabilirsiniz.',
  },
];

export default function HelpScreen() {
  const colors = useColors();
  const router = useRouter();

  const openEmail = () => {
    Linking.openURL('mailto:destek@pazaryeri.app?subject=Pazaryeri%20Destek').catch(() => null);
  };

  return (
    <ProfileScreenLayout title="Yardım ve Destek">
      <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="mail-outline" size={28} color={colors.primary} />
        <View style={styles.contactText}>
          <Text style={[styles.contactTitle, { color: colors.foreground }]}>Bize ulaşın</Text>
          <Text style={[styles.contactSub, { color: colors.mutedForeground }]}>destek@pazaryeri.app</Text>
        </View>
        <Pressable style={[styles.contactBtn, { backgroundColor: colors.primary }]} onPress={openEmail}>
          <Text style={styles.contactBtnText}>E-posta Gönder</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sık Sorulan Sorular</Text>
      {FAQ.map((item) => (
        <View key={item.q} style={[styles.faqItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.faqQ, { color: colors.foreground }]}>{item.q}</Text>
          <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{item.a}</Text>
        </View>
      ))}

      <View style={styles.links}>
        <Pressable style={styles.linkRow} onPress={() => router.push('/terms')}>
          <Text style={[styles.linkText, { color: colors.primary }]}>Kullanım Şartları</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => router.push('/privacy')}>
          <Text style={[styles.linkText, { color: colors.primary }]}>Gizlilik Politikası</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </ProfileScreenLayout>
  );
}

const styles = StyleSheet.create({
  contactCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  contactText: { alignItems: 'center' },
  contactTitle: { fontSize: 17, fontWeight: '700' },
  contactSub: { fontSize: 14, marginTop: 2 },
  contactBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  contactBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  faqQ: { fontSize: 15, fontWeight: '600' },
  faqA: { fontSize: 14, lineHeight: 20 },
  links: { marginTop: 8, gap: 4 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  linkText: { fontSize: 15, fontWeight: '600' },
});
