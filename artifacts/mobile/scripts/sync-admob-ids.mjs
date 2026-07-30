#!/usr/bin/env node
/**
 * Admin panelde yayınlanan AdMob App ID'lerini API'den çekip
 * native build için config/admob.ids.json dosyasına yazar.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.join(__dirname, '..');
const outPath = path.join(mobileRoot, 'config', 'admob.ids.json');
const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'https://pazaryerim.onrender.com').replace(/\/$/, '');

function pickAppId(admob, key) {
  for (const unit of ['banner', 'interstitial', 'rewarded']) {
    const v = admob?.[unit]?.[key]?.trim?.() ?? admob?.[unit]?.[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

async function main() {
  const res = await fetch(`${apiUrl}/api/config`);
  if (!res.ok) {
    throw new Error(`API config alınamadı: ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  const admob = body?.config?.['mobile.admob'];
  const androidAppId = pickAppId(admob, 'androidAppId');
  const iosAppId = pickAppId(admob, 'iosAppId') || androidAppId;

  if (!androidAppId) {
    console.warn('[sync-admob-ids] Android App ID yok — mevcut admob.ids.json korunuyor');
    process.exit(0);
  }

  const payload = {
    androidAppId,
    iosAppId,
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log('[sync-admob-ids] OK', androidAppId);
}

main().catch((err) => {
  console.error('[sync-admob-ids]', err.message);
  process.exit(1);
});
