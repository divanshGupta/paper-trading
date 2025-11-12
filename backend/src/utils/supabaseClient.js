import { createClient } from "@supabase/supabase-js";
import '../config/env.js';  // Ensure environment is loaded first

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

console.log('Debug - Environment Variables:', {
  SUPABASE_URL: SUPABASE_URL ? '✓ Found' : '✗ Missing',
  SUPABASE_SERVICE_ROLE: SUPABASE_SERVICE_ROLE ? '✓ Found' : '✗ Missing',
  NODE_ENV: process.env.NODE_ENV
});

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error(
    "Missing Supabase credentials. Ensure both SUPABASE_URL and SUPABASE_SERVICE_ROLE are set in your .env file."
  );
}

// Initialize Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

export { supabaseAdmin as supabase };
