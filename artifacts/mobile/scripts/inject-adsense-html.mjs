#!/usr/bin/env node
/**
 * Statik export index.html dosyasına AdSense + Google Analytics (GA4) ekler.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
const adsenseClient = 'ca-pub-7876914696425843';
const gaId = 'G-X4KF641X5R';

if (!fs.existsSync(distIndex)) {
  console.warn('inject-adsense-html: dist/index.html yok, atlanıyor.');
  process.exit(0);
}

let html = fs.readFileSync(distIndex, 'utf8');

const adsenseSnippet = [
  `<meta name="google-adsense-account" content="${adsenseClient}">`,
  `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}" crossorigin="anonymous"></script>`,
].join('\n  ');

const gaSnippet = [
  `<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>`,
  `<script>`,
  `  window.dataLayer = window.dataLayer || [];`,
  `  function gtag(){dataLayer.push(arguments);}`,
  `  gtag('js', new Date());`,
  `  gtag('config', '${gaId}', { send_page_view: true });`,
  `</script>`,
].join('\n  ');

if (!html.includes('google-adsense-account')) {
  html = html.replace('</head>', `  ${adsenseSnippet}\n</head>`);
}

if (!html.includes(gaId)) {
  html = html.replace('</head>', `  ${gaSnippet}\n</head>`);
}

fs.writeFileSync(distIndex, html);
console.log('inject-adsense-html: AdSense + GA4 etiketleri index.html içine eklendi.');
