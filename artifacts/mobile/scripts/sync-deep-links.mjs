#!/usr/bin/env node
/**
 * assetlinks.json ve apple-app-site-association dosyalarını günceller.
 * Env: ANDROID_SHA256_FINGERPRINTS (virgülle ayrılmış) veya config/deep-links.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public', '.well-known');
const configPath = path.join(root, 'config', 'deep-links.json');

function loadConfig() {
  let file = { androidSha256Fingerprints: [], appleTeamId: '' };
  if (fs.existsSync(configPath)) {
    try {
      file = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      /* ignore */
    }
  }
  const fromEnv = process.env.ANDROID_SHA256_FINGERPRINTS?.split(',')
    .map((s) => s.trim().toUpperCase().replace(/:/g, ''))
    .filter(Boolean);
  const fingerprints =
    fromEnv?.length ? fromEnv : (file.androidSha256Fingerprints ?? []).map((s) => String(s).toUpperCase().replace(/:/g, ''));
  const teamId = process.env.APPLE_TEAM_ID?.trim() || file.appleTeamId?.trim() || '';
  return { fingerprints, teamId };
}

const { fingerprints, teamId } = loadConfig();

const assetlinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.pazaryerim',
      sha256_cert_fingerprints: fingerprints,
    },
  },
];

const aasa = {
  applinks: {
    apps: [],
    details: [
      {
        appID: teamId ? `${teamId}.com.pazaryerim` : 'TEAMID.com.pazaryerim',
        paths: ['/listing/*', '/kesfet', '/kesfet/*', '/ilan/*', '/'],
      },
    ],
  },
};

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'assetlinks.json'), JSON.stringify(assetlinks, null, 2));
fs.writeFileSync(path.join(publicDir, 'apple-app-site-association'), JSON.stringify(aasa, null, 2));

if (fingerprints.length === 0) {
  console.warn('assetlinks.json: SHA256 fingerprint yok — EAS build sonrası config/deep-links.json güncelleyin.');
} else {
  console.log(`assetlinks.json: ${fingerprints.length} fingerprint yazıldı.`);
}
