import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error(
    "SUPABASE_URL must be set. Please add your Supabase project URL to environment variables.",
  );
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error(
    "SUPABASE_ANON_KEY must be set. Please add your Supabase anon key to environment variables.",
  );
}

// Clean up the URL by removing extra quotes and slashes
const supabaseUrl = process.env.SUPABASE_URL?.replace(/['"]/g, '').replace(/\/$/, '');

export const supabase = createClient(
  supabaseUrl!,
  process.env.SUPABASE_ANON_KEY!
);

// Admin client for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);