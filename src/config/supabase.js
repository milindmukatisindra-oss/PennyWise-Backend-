import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

let supabaseClient = null;

const isSupabaseConfigured = Boolean(
  config.supabaseUrl &&
  (config.supabaseServiceRoleKey || config.supabaseAnonKey) &&
  !config.supabaseUrl.includes('your-project-id')
);

if (isSupabaseConfigured) {
  // Use Service Role Key on the backend if available for administrative/secure queries,
  // otherwise fallback to Anon Key. Note: NEVER expose Service Role Key to frontend.
  const apiKey = config.supabaseServiceRoleKey || config.supabaseAnonKey;
  supabaseClient = createClient(config.supabaseUrl, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  console.log('✅ Connected to Supabase PostgreSQL at:', config.supabaseUrl);
} else {
  console.warn('⚠️ Supabase credentials not configured in backend/.env. Using development in-memory data store for local testing.');
}

export { supabaseClient, isSupabaseConfigured };
