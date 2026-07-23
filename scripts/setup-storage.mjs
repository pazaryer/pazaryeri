#!/usr/bin/env node
/**
 * Supabase Storage bucket kurulumu (listings — public)
 * .env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env)');
  process.exit(1);
}

async function ensureBucket() {
  const listRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (listRes.ok) {
    const buckets = await listRes.json();
    if (Array.isArray(buckets) && buckets.some((b) => b.id === 'listings')) {
      console.log('✅ listings bucket zaten var');
      return;
    }
  }

  const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: 'listings', name: 'listings', public: true }),
  });

  const body = await createRes.text();
  if (!createRes.ok) {
    if (body.includes('already exists') || body.includes('Duplicate')) {
      console.log('✅ listings bucket zaten var');
      return;
    }
    throw new Error(`Bucket oluşturulamadı (${createRes.status}): ${body}`);
  }

  console.log('✅ listings bucket oluşturuldu (public)');
}

ensureBucket().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
