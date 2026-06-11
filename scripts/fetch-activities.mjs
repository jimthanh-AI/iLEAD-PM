// One-time script: fetch all activity names from Supabase
// Run: node scripts/fetch-activities.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env file manually
const envPath = resolve(__dirname, '../.env');
const env = {};
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const { data, error } = await supabase
  .from('activities')
  .select('id, name')
  .order('pos');

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

console.log('Total activities:', data.length);
console.log('\n--- Activity list for translation ---\n');
data.forEach((a, i) => {
  console.log(`${i + 1}. ID: ${a.id}`);
  console.log(`   VI: ${a.name}`);
  console.log();
});
