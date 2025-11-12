"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      console.log("SIGNUP ERROR:", error);
      setBusy(false);
      if (error) return alert(error.message);
      alert("Account created. Now log in.");
      setMode("login");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log("AFTER LOGIN RESPONSE:", data, error);
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("SESSION AFTER SIGNIN:", sessionData);

    setBusy(false);
    if (error) return alert(error.message);

    // If email confirmation is ON, session may be null here.
    if (!sessionData.session) {
      alert("No session yet (likely email confirmation required). Disable it in Supabase for dev or confirm the email.");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col gap-3 p-10 min-h-screen justify-center items-center">
      <h1 className="text-xl font-bold">{mode === "login" ? "Login" : "Sign Up"}</h1>
      <input className="border px-3 py-2 rounded w-72" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="border px-3 py-2 rounded w-72" placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handle} disabled={busy} className="bg-black text-white px-4 py-2 rounded w-72">
        {busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
      </button>
      <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-blue-600 underline text-sm">
        {mode === "login" ? "Create a new account" : "Already have an account? Login"}
      </button>
      <button
        onClick={() => router.push("/dashboard")}
        className="border px-4 py-2 bg-amber-50 rounded w-72 mt-6"
      >
        TEST REDIRECT
      </button>

    </div>
  );
}
