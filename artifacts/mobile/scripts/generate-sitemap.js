#!/usr/bin/env node
/**
 * Build-time sitemap generator for Firebase Hosting.
 * Fetches active listings from API and writes public/sitemap.xml + robots.txt
 */
const fs = require('fs');
const path = require('path');

const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://pazaryeri0.web.app';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://pazaryerim.onrender.com').replace(/\/+$/, '');

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/kesfet', priority: '0.95', changefreq: 'daily' },
  { path: '/giris', priority: '0.4', changefreq: 'monthly' },
  { path: '/kayit', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
];

const CATEGORY_PATHS = [
  '/kesfet?kategori=Elektronik',
  '/kesfet?kategori=Telefon',
  '/kesfet?kategori=Bilgisayar',
  '/kesfet?kategori=Ara%C3%A7',
  '/kesfet?kategori=Emlak',
  '/kesfet?kategori=Mobilya',
  '/kesfet?kategori=Ev%20%26%20Bah%C3%A7e',
  '/kesfet?kategori=Moda',
  '/kesfet?kategori=Spor',
  '/kesfet?kategori=Bebek',
  '/kesfet?kategori=Hobi',
  '/kesfet?kategori=%C4%B0%C5%9F%20%26%20Ofis',
  '/kesfet?kategori=Hayvanlar',
  '/kesfet?kategori=M%C3%BCzik',
  '/kesfet?kategori=Beyaz%20E%C5%9Fya',
  '/kesfet?kategori=Kozmetik',
  '/kesfet?kategori=Antika',
];

const SEARCH_PATHS = [
  '/kesfet?q=ikinci+el',
  '/kesfet?q=al%C4%B1m+sat%C4%B1m',
  '/kesfet?q=pazaryeri',
  '/kesfet?q=%C3%BCcretsiz+ilan',
  '/kesfet?q=ikinci+el+telefon',
  '/kesfet?q=ikinci+el+araba',
  '/kesfet?q=ikinci+el+mobilya',
  '/kesfet?q=ikinci+el+laptop',
  '/kesfet?q=sat%C4%B1l%C4%B1k',
  '/kesfet?q=ikinci+el+e%C5%9Fya',
];

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchListings() {
  const items = [];
  let page = 1;
  const limit = 100;

  while (page <= 50) {
    const url = `${API_URL}/api/listings?limit=${limit}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Listings fetch failed (page ${page}): HTTP ${res.status}`);
      break;
    }
    const data = await res.json();
    const batch = data.items ?? [];
    if (batch.length === 0) break;
    for (const item of batch) {
      if (item.status === 'active' && item.id) {
        items.push({ id: item.id, updatedAt: item.updatedAt ?? item.updated_at });
      }
    }
    if (batch.length < limit) break;
    page++;
  }

  return items;
}

function writeUrl(urls, path, priority, changefreq, lastmod) {
  urls.push(`  <url>
    <loc>${xmlEscape(`${SITE_URL}${path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`);
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(path.join(publicDir, '.well-known'), { recursive: true });

  const iconSrc = path.join(__dirname, '..', 'assets', 'images', 'icon.png');
  const ogDest = path.join(publicDir, 'og-image.png');
  if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, ogDest);
    console.log('Copied og-image.png');
  }

  let listings = [];
  try {
    listings = await fetchListings();
    console.log(`Fetched ${listings.length} active listings for sitemap`);
  } catch (err) {
    console.warn('Could not fetch listings, generating static pages only:', err.message);
  }

  const now = new Date().toISOString().split('T')[0];
  const urls = [];

  for (const page of STATIC_PAGES) {
    writeUrl(urls, page.path, page.priority, page.changefreq, now);
  }

  for (const catPath of CATEGORY_PATHS) {
    writeUrl(urls, catPath, '0.85', 'daily', now);
  }

  for (const searchPath of SEARCH_PATHS) {
    writeUrl(urls, searchPath, '0.75', 'weekly', now);
  }

  for (const listing of listings) {
    const lastmod = (listing.updatedAt ?? now).toString().split('T')[0];
    writeUrl(urls, `/listing/${listing.id}`, '0.8', 'weekly', lastmod);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;

  const robots = `# Pazaryeri — https://pazaryeri0.web.app
User-agent: *
Allow: /
Allow: /kesfet
Allow: /listing/
Disallow: /hesabim
Disallow: /mesajlar
Disallow: /ilan-ver
Disallow: /ilan-duzenle/
Disallow: /chat/
Disallow: /notifications
Disallow: /favorilerim
Disallow: /oauth/
Disallow: /auth
Disallow: /settings
Disallow: /(tabs)/

User-agent: Googlebot
Allow: /
Allow: /kesfet
Allow: /listing/

Sitemap: ${SITE_URL}/sitemap.xml
`;

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots, 'utf8');
  console.log(`Wrote sitemap with ${urls.length} URLs and robots.txt`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
