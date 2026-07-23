import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Pazaryeri — Türkiye'nin İkinci El Pazaryeri</title>
        <meta name="description" content="Pazaryeri — Türkiye'nin ikinci el alım-satım platformu. Ücretsiz ilan verin, elektronik, araç, mobilya ve daha fazlasını alın veya satın." />
        <meta property="og:title" content="Pazaryeri — Türkiye'nin İkinci El Pazaryeri" />
        <meta property="og:description" content="Ücretsiz ilan verin. Güvenli mesajlaşma ile alım-satım yapın." />
        <meta property="og:url" content="https://pazaryeri0.web.app" />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content="#3D1A78" />
        <ScrollViewStyleReset />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
