import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export default function TermsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Kullanım Şartları</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: colors.foreground }]}>1. Hizmet Tanımı</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Pazaryeri, kullanıcıların ikinci el ürün alım-satımı yapabildiği bir mobil platformdur. Platform yalnızca alıcı ve satıcıyı buluşturur; ödeme ve teslimat kullanıcılar arasında gerçekleşir.
        </Text>
        <Text style={[styles.heading, { color: colors.foreground }]}>2. Kullanıcı Sorumlulukları</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Kullanıcılar doğru ve güncel bilgi vermekle yükümlüdür. Sahte, yanıltıcı veya yasadışı ilan yayınlamak yasaktır. İhlal durumunda hesap askıya alınabilir.
        </Text>
        <Text style={[styles.heading, { color: colors.foreground }]}>3. İlan Kuralları</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          İlanlar gerçek ürünleri yansıtmalıdır. Uygunsuz içerik, telif hakkı ihlali veya spam ilanlar kaldırılır. Platform, uygunsuz içerikleri önceden haber vermeksizin kaldırma hakkını saklı tutar.
        </Text>
        <Text style={[styles.heading, { color: colors.foreground }]}>4. Sorumluluk Reddi</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Pazaryeri, kullanıcılar arasındaki işlemlerden sorumlu değildir. Alım-satım işlemlerinde dikkatli olunması ve yüz yüze görüşme tercih edilmesi önerilir.
        </Text>
        <Text style={[styles.heading, { color: colors.foreground }]}>5. Değişiklikler</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Bu şartlar önceden haber verilmeksizin güncellenebilir. Güncellemeler uygulama içinde duyurulur.
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
