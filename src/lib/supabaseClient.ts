// src/lib/supabaseClient.ts
// -----------------------------------------------
// SETUP: Create a .env file in your project root
// and add these two lines:
//
//   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=your_anon_key_here
//
// Get these from: Supabase Dashboard → Settings → API
// -----------------------------------------------

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('xxxxxxxxxxxx')
);

if (!isConfigured) {
  console.warn(
    '[BazarSetu] Supabase env vars missing or default. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  );
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

