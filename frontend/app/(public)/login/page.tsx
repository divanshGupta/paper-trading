"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // If already logged in → redirect
  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace("/dashboard");
      else setLoading(false);
    }
    check();
  }, [router]);

  if (loading) return null;

  const handleSubmit = async () => {
    setBusy(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });

      setBusy(false);

      if (error) return alert(error.message);

      alert("Account created! Please verify your email.");
      setMode("login");
      return;
    }

    // LOGIN
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) return alert(error.message);

    router.push("/dashboard");
  };

  return (
    <div className="bg-bg-main flex flex-col gap-3 p-10 min-h-screen justify-center items-center">
      <h1 className="text-xl font-bold">
        {mode === "login" ? "Login" : "Create Account"}
      </h1>

      <input
        className="bg-bg-surface border px-3 py-2 rounded w-72"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="bg-bg-surface border px-3 py-2 rounded w-72"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={busy}
        className={`${mode === "login" ? "bg-[var(--color-brand)]": "bg-yellow"} text-black font-semibold px-4 py-2 rounded w-72 mt-2`}
      >
        {busy ? "Please wait..." : mode === "login" ? "Login" : "Sign Up"}
      </button>

      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className=" text-text underline text-base"
      >
        {mode === "login"
          ? "Create a new account"
          : "Already have an account? Login"}
      </button>
    </div>
  );
}
