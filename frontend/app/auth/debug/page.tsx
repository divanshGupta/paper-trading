"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function AuthDebug() {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const sess = await supabase.auth.getSession();
      const usr = await supabase.auth.getUser();
      setInfo({ session: sess.data, user: usr.data });
    })();
  }, []);

  return <pre className="p-4 text-xs">{JSON.stringify(info, null, 2)}</pre>;
}
