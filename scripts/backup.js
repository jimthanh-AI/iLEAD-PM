/**
 * iLEAD PM - Manual Backup Script
 * Usage:  node scripts/backup.js
 * Output: backups/ilead-backup-YYYY-MM-DD_HH-MM.json
 *
 * Requires .env.local in project root:
 *   VITE_SUPABASE_URL=https://xxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load .env.local / .env
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  readFileSync(path, 'utf8').split('\n').forEach(line => {
    const eq = line.indexOf('=');
    if (eq < 1) return;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (k && !process.env[k]) process.env[k] = v;
  });
}
loadEnvFile(join(root, '.env.local'));
loadEnvFile(join(root, '.env'));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\nThieu Supabase credentials.');
  console.error('Tao file .env.local o thu muc goc voi noi dung:');
  console.error('  VITE_SUPABASE_URL=https://xxx.supabase.co');
  console.error('  VITE_SUPABASE_ANON_KEY=eyJ...\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchAll() {
  console.log('Ket noi Supabase...');
  const [p, a, t, ai, m, pb] = await Promise.all([
    supabase.from('partners').select('*'),
    supabase.from('activities').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('activity_indicators').select('*'),
    supabase.from('mel_entries').select('*'),
    supabase.from('partner_budgets').select('*'),
  ]);

  const errs = [p, a, t, ai, m, pb]
    .filter(r => r.error)
    .map(r => r.error.message);
  if (errs.length) throw new Error('Supabase loi: ' + errs.join(', '));

  return {
    __v: 4,
    partners:           p.data  || [],
    activities:         a.data  || [],
    tasks:              t.data  || [],
    activityIndicators: ai.data || [],
    melEntries:         m.data  || [],
    partnerBudgets:     pb.data || [],
    exportedAt: new Date().toISOString(),
  };
}

async function run() {
  try {
    const data = await fetchAll();

    const stamp = new Date().toISOString().replace('T', '_').slice(0, 16).replace(':', '-');
    const dir   = join(root, 'backups');
    mkdirSync(dir, { recursive: true });
    const file  = join(dir, `ilead-backup-${stamp}.json`);

    writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');

    console.log('\nBackup hoan thanh!');
    console.log('File: ' + file);
    console.log('  partners:           ' + data.partners.length);
    console.log('  activities:         ' + data.activities.length);
    console.log('  tasks:              ' + data.tasks.length);
    console.log('  activityIndicators: ' + data.activityIndicators.length);
    console.log('  melEntries:         ' + data.melEntries.length);
    console.log('  partnerBudgets:     ' + data.partnerBudgets.length);
    console.log('  exportedAt:         ' + data.exportedAt + '\n');
  } catch (err) {
    console.error('\nBackup that bai: ' + err.message + '\n');
    process.exit(1);
  }
}

run();
