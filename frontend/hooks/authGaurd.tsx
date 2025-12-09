"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verify() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        if (mounted) setChecked(false); // reset
        router.replace("/login");
        return;
      }

      if (mounted) setChecked(true);
    }

    verify();

    // listen to login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setChecked(false); // mark protected content as unavailable
          router.replace("/login");
        } else {
          setChecked(true);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  if (!checked) return null; // do not render protected content

  return <>{children}</>;
}
