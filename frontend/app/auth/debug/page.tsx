"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
// 1. Import the necessary types from the core Supabase library
import type { Session, User } from '@supabase/supabase-js';

// 2. Define a type for the state object, which can be the data structure 
//    or null (when it's initializing).
type AuthInfo = {
  session: Session | null;
  user: User | null;
} | null;

export default function AuthDebug() {
  // 3. Use the defined AuthInfo type instead of 'any'
  const [info, setInfo] = useState<AuthInfo>(null);

  useEffect(() => {
    const fetchAuthData = async () => {
      // Fetch session and user data
      // We destructure { data: { session } } to pull the actual session object
      // (which is Session | null) out of the response object.
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();

      // Set the clean structure (session and user objects)
      setInfo({ session, user });
    };

    fetchAuthData();
  }, []);

  return <pre className="p-4 text-xs">{JSON.stringify(info, null, 2)}</pre>;
}
