import { useRouter } from 'expo-router';
import { PageShell, Section } from '@/components/PageShell';
import { MenuCard } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function MoreScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  return (
    <PageShell
      title="Diğer"
      subtitle={`${profile?.name ?? 'Admin'} · Yönetim araçları`}
    >
      <Section title="Analitik">
        <MenuCard
          icon="🌐"
          title="Web Ziyaretçileri"
          subtitle="Girişler, oturumlar ve canlı hareketler"
          onPress={() => router.push('/(tabs)/web-analytics')}
        />
      </Section>

      <Section title="Kontrol Merkezi">
        <MenuCard
          icon="🎛️"
          title="Site Kontrol Merkezi"
          subtitle="Marka, CMS, duyurular — tek hub"
          onPress={() => router.push('/(tabs)/cms')}
        />
        <MenuCard
          icon="✨"
          title="Marka & Kimlik"
          subtitle="İsim, logo, renkler, SEO — tam rebrand"
          onPress={() => router.push('/(tabs)/branding')}
        />
        <MenuCard
          icon="📱"
          title="Mobil Promosyon"
          subtitle="Puanla, diğer uygulamalar, sponsor banner"
          onPress={() => router.push('/(tabs)/mobile-promo')}
        />
      </Section>

      <Section title="İçerik & Moderasyon">
        <MenuCard
          icon="📜"
          title="Kayan Yazılar"
          subtitle="Web ve mobil duyuru bandı"
          onPress={() => router.push('/(tabs)/marquee')}
        />
        <MenuCard
          icon="🚩"
          title="Şikayetler"
          subtitle="Bekleyen kullanıcı şikayetleri"
          onPress={() => router.push('/(tabs)/reports')}
        />
      </Section>

      <Section title="Sistem">
        <MenuCard
          icon="⚙️"
          title="CMS Ayarları"
          subtitle="Marka, SEO, kategoriler"
          onPress={() => router.push('/(tabs)/config')}
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
