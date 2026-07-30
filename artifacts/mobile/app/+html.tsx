import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const SITE_URL = 'https://pazaryeri0.web.app';
const ADSENSE_CLIENT = 'ca-pub-7876914696425843';
const GA_MEASUREMENT_ID = 'G-X4KF641X5R';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>Pazaryeri — İkinci El Alım Satım | Ücretsiz İlan Ver</title>
        <meta
          name="description"
          content="Pazaryeri ile ücretsiz ilan verin, ikinci el alım satım yapın. Telefon, araç, mobilya, elektronik ve binlerce kategoride güvenli ikinci el alışveriş."
        />
        <meta
          name="keywords"
          content="pazaryeri, ikinci el, alım satım, ücretsiz ilan, ikinci el telefon, ikinci el araba, ikinci el mobilya, ilan sitesi, güvenli alışveriş, türkiye pazaryeri"
        />
        <meta name="author" content="Pazaryeri" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="googlebot" content="index, follow" />
        <meta httpEquiv="content-language" content="tr" />
        <link rel="canonical" href={SITE_URL} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/og-image.png" />

        <meta property="og:site_name" content="Pazaryeri" />
        <meta property="og:title" content="Pazaryeri — İkinci El Alım Satım | Ücretsiz İlan Ver" />
        <meta
          property="og:description"
          content="Ücretsiz ilan verin. Güvenli mesajlaşma ile ikinci el alım satım yapın. Telefon, araç, mobilya ve daha fazlası."
        />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="tr_TR" />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pazaryeri — İkinci El Alım Satım" />
        <meta
          name="twitter:description"
          content="Ücretsiz ilan verin. Güvenli ikinci el alışveriş platformu."
        />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

        <meta name="theme-color" content="#3D1A78" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pazaryeri" />
        <meta name="application-name" content="Pazaryeri" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="google-adsense-account" content={ADSENSE_CLIENT} />

        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />

        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: true });
            `,
          }}
        />

        <ScrollViewStyleReset />
        <style>{`
          html, body { height: 100%; margin: 0; padding: 0; }
          body { overflow: auto !important; -webkit-overflow-scrolling: touch; }
          #root { display: flex; min-height: 100%; flex: 1; }
        `}</style>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://pazaryerim.onrender.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
