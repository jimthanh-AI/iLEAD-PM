import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env missing (e.g. local dev without .env), return a stub that fails soft
// instead of throwing at import time and bricking the whole app.
const stubError = { message: 'Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are not configured' };
const stubResult = Promise.resolve({ data: [], error: stubError });
const stubBuilder = () => {
  const b = {};
  ['select','insert','upsert','update','delete','eq','order','limit','single','then'].forEach(k => {
    b[k] = (...args) => k === 'then' ? stubResult.then(...args) : b;
  });
  return b;
};
const stubClient = {
  from: stubBuilder,
  channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
  removeChannel: () => {},
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (console.warn('[Supabase] env vars missing — using stub client (offline mode)'), stubClient);
