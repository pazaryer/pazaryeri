import { useRouter } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { PageShell, Section } from '@/components/PageShell';
import { MenuCard } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { THEME, SPACING, RADIUS } from '@/lib/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const roleLabel = profile?.role === 'admin' ? 'Süper Admin' : 'Moderatör';

  return (
    <PageShell
      title="Ayarlar"
      subtitle={`${profile?.name ?? 'Admin'} · ${roleLabel}`}
    >
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Kaydet ve Yayınla</Text>
        <Text style={styles.tipText}>
          Her ayar ekranında altın butonla yayınlayın. Değişiklikler ~60 saniye içinde web ve mobilde görünür.
        </Text>
      </View>

      <Section title="Marka & Web">
        <MenuCard
          icon="✨"
          title="Marka & Kimlik"
          subtitle="İsim, logo, renkler, ikonlar, SEO"
          onPress={() => router.push('/(tabs)/branding')}
        />
        <MenuCard
          icon="📂"
          title="Kategoriler & Sistem"
          subtitle="Kategori listesi, bakım modu, özellik anahtarları"
          onPress={() => router.push('/(tabs)/config')}
        />
        <MenuCard
          icon="📜"
          title="Kayan Yazılar"
          subtitle="Anasayfa duyuru bandı"
          onPress={() => router.push('/(tabs)/marquee')}
        />
        <MenuCard
          icon="⬇️"
          title="Web İndirme Butonu"
          subtitle="Yüzen mobil uygulama indirme CTA"
          onPress={() => router.push('/(tabs)/web-app-download')}
        />
      </Section>

      <Section title="Mobil Uygulama">
        <MenuCard
          icon="📱"
          title="Mobil Promosyon"
          subtitle="Geliştirici imzası, puanla, sayfa bazlı sponsor banner"
          onPress={() => router.push('/(tabs)/mobile-promo')}
        />
        <MenuCard
          icon="📊"
          title="AdMob Reklamları"
          subtitle="App ID, Unit ID, banner / geçiş / ödüllü toggle"
          onPress={() => router.push('/(tabs)/admob')}
        />
      </Section>

      <Section title="Analitik & Moderasyon">
        <MenuCard
          icon="🌐"
          title="Web Ziyaretçileri"
          subtitle="Oturumlar ve canlı hareketler"
          onPress={() => router.push('/(tabs)/web-analytics')}
        />
        <MenuCard
          icon="🚩"
          title="Şikayetler"
          subtitle="Bekleyen kullanıcı şikayetleri"
          onPress={() => router.push('/(tabs)/reports')}
        />
        <MenuCard
          icon="🛡️"
          title="Denetim Kaydı"
          subtitle="Admin işlem geçmişi"
          onPress={() => router.push('/(tabs)/audit')}
        />
      </Section>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  tipCard: {
    backgroundColor: THEME.goldMuted,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  tipTitle: { fontSize: 14, fontWeight: '800', color: THEME.goldLight, marginBottom: 4 },
  tipText: { fontSize: 12, color: THEME.textSoft, lineHeight: 18 },
});
