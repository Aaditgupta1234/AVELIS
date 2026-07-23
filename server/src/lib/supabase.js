import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn('[Supabase Admin] Warning: SUPABASE_URL environment variable is missing.');
}

if (!supabaseServiceKey) {
  console.warn('[Supabase Admin] Warning: SUPABASE_SERVICE_ROLE_KEY environment variable is missing.');
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder_key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const supabase = supabaseAdmin;
export default supabaseAdmin;
