import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,          // MUST be TRUE for browser apps
      autoRefreshToken: true,        // refresh expired tokens silently
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? localStorage : undefined,
    },
  }
);
