import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

if (!config.supabaseUrl || !config.supabaseSecretKey) {
  console.warn('⚠️ Supabase credentials (SUPABASE_URL / SUPABASE_SECRET_KEY) are missing in environment variables.');
}

/**
 * Singleton Supabase Client for Storage & Services.
 */
export const supabase = createClient(
  config.supabaseUrl || 'https://placeholder.supabase.co',
  config.supabaseSecretKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
