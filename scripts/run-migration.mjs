#!/usr/bin/env node
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = 'vqllsqrgwwzrehcegyot';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const file = process.argv[2] ?? 'migration-v5-performance.sql';

if (!ACCESS_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN gerekli');
  process.exit(1);
}

async function runQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SQL failed (${res.status}): ${text}`);
  return text;
}

const sql = readFileSync(resolve(__dirname, `../supabase/${file}`), 'utf8');
console.log(`Running ${file}...`);
try {
  await runQuery(sql);
  console.log('OK');
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
