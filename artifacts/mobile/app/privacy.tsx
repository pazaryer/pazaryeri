import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Gizlilik Politikası</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: colors.foreground }]}>1. Veri Toplama</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Pazaryeri uygulaması, hizmet sunabilmek için ad, e-posta, telefon numarası, konum ve profil fotoğrafı gibi kişisel verilerinizi toplar. Bu veriler KVKK kapsamında korunmaktadır.
        </Text>
        <Text style={[styles.heading, { color: colors.foreground }]}>2. Veri Kullanımı</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Toplanan veriler yalnızca ilan yayınlama, mesajlaşma, kullanıcı doğrulama ve uygulama iyileştirme amaçlarıyla kullanılır. Verileriniz üçüncü taraflarla paylaşılmaz.
        </Text>
        <Text style={[styles.heading, { color: colors.foreground }]}>3. Veri Güvenliği</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Verileriniz şifreli bağlantılar (HTTPS/TLS) üzerinden iletilir ve güvenli sunucularda saklanır. Supabase altyapısı ile endüstri standardı güvenlik önlemleri uygulanmaktadır.
        </Text>
        <Text style={[styles.heading, { color: colors.foreground }]}>4. Haklarınız</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          KVKK kapsamında verilerinize erişme, düzeltme, silme ve taşıma haklarına sahipsiniz. Talepleriniz için destek@pazaryeri.app adresine başvurabilirsiniz.
        </Text>
        <Text style={[styles.heading, { color: colors.foreground }]}>5. Çerezler ve Analitik</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Uygulama performansını iyileştirmek için anonim kullanım verileri toplanabilir. Bu veriler kişisel kimliğinizle ilişkilendirilmez.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 22 },
});
