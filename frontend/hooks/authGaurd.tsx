"use client";

import { useApp } from "@/components/providers/AppProvider";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const { profile, loading } = state;
  const router = useRouter();

  const isRedirecting = !loading && !profile;

  useEffect(() => {
    if (isRedirecting) {
      router.replace("/login"); // use replace to prevent going back
    }
  }, [isRedirecting, router]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Don't render anything while redirecting (avoids "stuck" blank page)
  if (isRedirecting) {
    return null;
  }

  return <>{children}</>;
}
