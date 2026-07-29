import React from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';

const ADSENSE_CLIENT = 'ca-pub-7876914696425843';

/** Web AdSense doğrulama ve reklam scripti — tüm sayfalarda */
export function AdSenseHead() {
  if (Platform.OS !== 'web') return null;

  return (
    <Head>
      <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        crossOrigin="anonymous"
      />
    </Head>
  );
}
