import { useRouter } from 'expo-router';
import { PageShell, Section } from '@/components/PageShell';
import { MenuCard } from '@/components/ui';

export default function CmsScreen() {
  const router = useRouter();

  return (
    <PageShell
      title="Site Kontrol Merkezi"
      subtitle="Web + mobil uygulamayı tek yerden yönetin"
    >
      <Section title="Marka & Görünüm">
        <MenuCard
          icon="✨"
          title="Marka & Kimlik"
          subtitle="İsim, logo, renkler, ikonlar, SEO"
          onPress={() => router.push('/(tabs)/branding')}
        />
        <MenuCard
          icon="📜"
          title="Kayan Yazılar"
          subtitle="Anasayfa duyuru bandı"
          onPress={() => router.push('/(tabs)/marquee')}
        />
      </Section>

      <Section title="İçerik & Özellikler">
        <MenuCard
          icon="📂"
          title="Kategoriler & Özellikler"
          subtitle="Kategori listesi, bakım modu, anahtarlar"
          onPress={() => router.push('/(tabs)/config')}
        />
      </Section>

      <Section title="İpucu">
        <MenuCard
          icon="🚀"
          title="Kaydet ve Yayınla"
          subtitle="Her ekranda altın buton — değişiklikler ~60 sn içinde yansır"
          onPress={() => router.push('/(tabs)/branding')}
        />
      </Section>
    </PageShell>
  );
}
