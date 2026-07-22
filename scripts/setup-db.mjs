#!/usr/bin/env node
/**
 * Supabase veritabanı kurulum scripti
 * Management API ile SQL çalıştırır
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = 'vqllsqrgwwzrehcgeyot';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN ortam degiskeni gerekli (.env dosyasindan)');
  process.exit(1);
}

async function runQuery(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`SQL failed (${res.status}): ${text}`);
  }
  return text;
}

async function main() {
  console.log('🚀 Supabase veritabanı kurulumu başlıyor...\n');

  const sqlPath = resolve(__dirname, '../supabase/setup.sql');
  const fullSql = readFileSync(sqlPath, 'utf-8');

  // Split by semicolons but keep DO blocks intact
  const statements = [];
  let current = '';
  let inDoBlock = false;

  for (const line of fullSql.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue;

    if (trimmed.startsWith('DO $$')) inDoBlock = true;
    current += line + '\n';
    if (inDoBlock && trimmed === 'END $$;') {
      statements.push(current.trim());
      current = '';
      inDoBlock = false;
      continue;
    }
    if (!inDoBlock && trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());

  let success = 0;
  let skipped = 0;

  for (const stmt of statements) {
    if (!stmt || stmt.length < 5) continue;
    const preview = stmt.slice(0, 60).replace(/\n/g, ' ');
    try {
      await runQuery(stmt);
      console.log(`✅ ${preview}...`);
      success++;
    } catch (err) {
      const msg = err.message ?? String(err);
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate') ||
        msg.includes('42710') ||
        msg.includes('42P07')
      ) {
        console.log(`⏭️  Zaten var: ${preview}...`);
        skipped++;
      } else {
        console.error(`❌ HATA: ${preview}...`);
        console.error(`   ${msg.slice(0, 200)}`);
      }
    }
  }

  console.log(`\n🎉 Tamamlandı: ${success} başarılı, ${skipped} atlandı`);
}

main().catch((err) => {
  console.error('Kurulum başarısız:', err.message);
  process.exit(1);
});
