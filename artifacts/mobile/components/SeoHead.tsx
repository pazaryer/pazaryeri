import React from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';
import {
  SEO_BRAND,
  SEO_KEYWORDS,
  SEO_TAGLINE,
  canonicalUrl,
  ogImageUrl,
  seoDescription,
  seoTitle,
} from '@/lib/seo';

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

type Props = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  noindex?: boolean;
  type?: 'website' | 'article' | 'product';
  jsonLd?: JsonLd;
};

export function SeoHead({
  title,
  description,
  path = '/',
  image,
  noindex = false,
  type = 'website',
  jsonLd,
}: Props) {
  if (Platform.OS !== 'web') return null;

  const pageTitle = seoTitle(title);
  const pageDescription = seoDescription(description);
  const url = canonicalUrl(path);
  const ogImage = ogImageUrl(image);
  const robots = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const ldScripts = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))
    : null;

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={SEO_KEYWORDS} />
      <meta name="author" content={SEO_BRAND} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta name="language" content="Turkish" />
      <meta httpEquiv="content-language" content="tr" />
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={SEO_BRAND} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="tr_TR" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${SEO_BRAND} — ${SEO_TAGLINE}`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImage} />

      <meta name="apple-mobile-web-app-title" content={SEO_BRAND} />
      <meta name="application-name" content={SEO_BRAND} />
      {ldScripts}
    </Head>
  );
}
