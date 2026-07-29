#!/usr/bin/env node
/**
 * EAS Android imza SHA-256 parmak izlerini config/deep-links.json dosyasına yazar.
 * Kullanım: EXPO_TOKEN=... node scripts/fetch-eas-fingerprints.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const configPath = path.join(root, 'config', 'deep-links.json');

if (!process.env.EXPO_TOKEN?.trim()) {
  console.error('EXPO_TOKEN gerekli. artifacts/mobile/.env dosyasından alın.');
  process.exit(1);
}

try {
  const out = execSync('npx --yes eas-cli@latest credentials -p android --non-interactive', {
    cwd: root,
    env: { ...process.env, EAS_NO_VCS: '1' },
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const matches = [...out.matchAll(/SHA-?256(?: Fingerprint)?:\s*([A-F0-9:]+)/gi)];
  const fingerprints = [...new Set(matches.map((m) => m[1].replace(/:/g, '').toUpperCase()))];

  if (fingerprints.length === 0) {
    console.error('SHA-256 bulunamadı. EAS çıktısını kontrol edin.');
    process.exit(1);
  }

  const config = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
    : {};
  config.androidSha256Fingerprints = fingerprints;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`deep-links.json güncellendi: ${fingerprints.length} fingerprint`);
  console.log('pnpm web:build ile assetlinks.json yeniden üretin.');
} catch (err) {
  console.error('EAS credentials alınamadı:', err.message);
  process.exit(1);
}
