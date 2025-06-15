import { createClient } from '@supabase/supabase-js';

// Create clients dynamically to avoid process not defined error
let supabase = null;
let supabaseAdmin = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdmin;
}

export { getSupabase as supabase, getSupabaseAdmin as supabaseAdmin }; 