"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

/**
 * This page is the first thing users see after clicking the magic link.
 * Supabase JS will parse the URL hash (?/#access_token=...) and persist the session.
 * Then we redirect to /dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const finalize = async () => {
      // Force a read so supabase-js parses the URL hash and stores the session
      const { data } = await supabase.auth.getSession();

      // Optional: log once while debugging
      // console.log("auth callback session:", data.session);

      // If session exists, go to dashboard; otherwise back to login
      if (data.session?.user) router.replace("/dashboard");
      else router.replace("/login");
    };

    finalize();
  }, [router]);

  return <div className="p-6">Signing you in…</div>;
}
