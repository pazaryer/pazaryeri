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
  { path: '/kesfet', priority: '0.9', changefreq: 'daily' },
  { path: '/giris', priority: '0.5', changefreq: 'monthly' },
  { path: '/kayit', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
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

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  fs.mkdirSync(publicDir, { recursive: true });

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
    urls.push(`  <url>
    <loc>${xmlEscape(`${SITE_URL}${page.path}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  for (const listing of listings) {
    const lastmod = (listing.updatedAt ?? now).toString().split('T')[0];
    urls.push(`  <url>
    <loc>${xmlEscape(`${SITE_URL}/listing/${listing.id}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  const robots = `User-agent: *
Allow: /
Disallow: /hesabim
Disallow: /mesajlar
Disallow: /ilan-ver
Disallow: /chat/

Sitemap: ${SITE_URL}/sitemap.xml
`;

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots, 'utf8');
  console.log('Wrote public/sitemap.xml and public/robots.txt');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
