import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

const rawUrl = config.supabaseUrl ? String(config.supabaseUrl).trim().replace(/^["']|["']$/g, '') : '';
const rawKey = config.supabaseSecretKey ? String(config.supabaseSecretKey).trim().replace(/^["']|["']$/g, '') : '';

const validUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : 'https://placeholder.supabase.co';
const validKey = rawKey.length > 0 ? rawKey : 'placeholder-key';

if (!config.supabaseUrl || !config.supabaseSecretKey) {
  console.warn('⚠️ Supabase credentials (SUPABASE_URL / SUPABASE_SECRET_KEY) are missing in environment variables.');
}

/**
 * Singleton Supabase Client for Storage & Services.
 */
export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
