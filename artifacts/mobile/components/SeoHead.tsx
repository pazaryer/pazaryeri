import React from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';
import { useBrand } from '@/contexts/BrandContext';
import { sitePath } from '@/lib/config';
import { canonicalUrl } from '@/lib/seo';

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
  const brand = useBrand();

  if (Platform.OS !== 'web') return null;

  const pageTitle = title
    ? title.includes(brand.name)
      ? title
      : `${title} | ${brand.name}`
    : brand.seo.title;
  const pageDescription = description ?? brand.seo.description;
  const url = canonicalUrl(path);
  const ogImage = image?.startsWith('http') ? image : brand.assets.ogImageUrl || sitePath('/og-image.png');
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
      <meta name="keywords" content={brand.seo.keywords} />
      <meta name="author" content={brand.name} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta name="language" content="Turkish" />
      <meta httpEquiv="content-language" content="tr" />
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={brand.name} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="tr_TR" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${brand.name} — ${brand.tagline}`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImage} />

      <meta name="apple-mobile-web-app-title" content={brand.name} />
      <meta name="application-name" content={brand.name} />
      {ldScripts}
    </Head>
  );
}
