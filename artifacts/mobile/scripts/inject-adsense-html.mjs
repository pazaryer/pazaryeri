#!/usr/bin/env node
/**
 * Statik export index.html dosyasına AdSense meta/script ekler (+html.tsx export'ta birleşmeyebilir).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
const client = 'ca-pub-7876914696425843';

if (!fs.existsSync(distIndex)) {
  console.warn('inject-adsense-html: dist/index.html yok, atlanıyor.');
  process.exit(0);
}

let html = fs.readFileSync(distIndex, 'utf8');
const snippet = [
  `<meta name="google-adsense-account" content="${client}">`,
  `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>`,
].join('\n');

if (!html.includes('google-adsense-account')) {
  html = html.replace('</head>', `  ${snippet}\n</head>`);
  fs.writeFileSync(distIndex, html);
  console.log('inject-adsense-html: AdSense etiketleri index.html içine eklendi.');
} else {
  console.log('inject-adsense-html: zaten mevcut.');
}
