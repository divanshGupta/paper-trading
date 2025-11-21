"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers/AppProvider";

// type ProfileMenuProps = {
//   name: string;
//   email: string;
// };

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { state, refresh } = useApp();
  const { profile, loading } = state;
  const name = profile?.name || "User";
  const email = profile?.email || "";
  
  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function toggleTheme() {
    const html = document.documentElement;

    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-[var(--brand)] flex items-center justify-center text-black font-semibold shadow"
      >
        {name.charAt(0).toUpperCase()}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="
          absolute right-0 mt-3 w-72 
          bg-gray-50 border border-gray-300
          rounded-xl shadow-lg p-4 z-50
        ">
          {/* User Info */}
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <Link href="/profile" className="text-[var(--text)] font-semibold text-lg">{name}</Link>
                <p className="text-[var(--text-secondary)] text-sm">{email}</p>
              </div>

              <Link href="/profile" className="text-[var(--text-secondary)] hover:text-[var(--text)]">
                ⚙️
              </Link>
            </div>
          </div>

          <hr className="border-[var(--border)] my-2" />

          {/* Menu Items */}
          <ul className="space-y-3 py-1 text-sm">
            <li className="flex justify-between items-center hover:bg-[var(--bg)] p-2 rounded-lg cursor-pointer">
              <div className="flex gap-3 items-center">
                📦 <span>All Orders</span>
              </div>
              <span>›</span>
            </li>

            <li className="flex justify-between items-center hover:bg-[var(--bg)] p-2 rounded-lg cursor-pointer">
              <div className="flex gap-3 items-center">
                🏦 <span>Bank Details</span>
              </div>
              <span>›</span>
            </li>

            <li className="flex justify-between items-center hover:bg-[var(--bg)] p-2 rounded-lg cursor-pointer">
              <div className="flex gap-3 items-center">
                🎧 <span>24×7 Support</span>
              </div>
              <span>›</span>
            </li>

            <li className="flex justify-between items-center hover:bg-[var(--bg)] p-2 rounded-lg cursor-pointer">
              <div className="flex gap-3 items-center">
                📊 <span>Reports</span>
              </div>
              <span>›</span>
            </li>
          </ul>

          <hr className="border-[var(--border)] my-2" />

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="
              w-full text-left p-2 rounded-lg 
              hover:bg-[var(--bg)] text-[var(--text-secondary)]
            "
          >
            🌗 Toggle Theme
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="
              w-full mt-2 text-left text-red-500 
              font-medium p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20
            "
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
