"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers/AppProvider";
import ThemeToggle from "../ui/ThemeToggle";
import { ChevronRight, Settings } from "lucide-react";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { state } = useApp();
  const { profile } = state;
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

  // logout 
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    logout(); // signOut + clears store
    router.replace("/login");
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 text-2xl font-normal rounded-full hover:bg-bg-surface flex items-center justify-center text-text"
      >
        {name.charAt(0).toUpperCase()}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="
          absolute right-0 mt-3 w-72 
          bg-bg-elevated border border-border
          rounded-xl shadow-lg  z-50
        ">
          {/* User Info */}
          <div className="">
            <div className="">
              <div className="p-4 flex justify-between items-start border-b border-border">
                <div>
                  <Link href="/profile" className="text-text font-semibold text-lg">{name}</Link>
                  <p className="text-text-secondary text-sm">{email}</p>
                </div>

                <Link href="/profile" className="text-text-secondary hover:text-text">
                  <Settings />
                </Link>
              </div>
            </div>

            {/* Menu Items */}
            <ul className="text-sm">
              <li className="p-4 flex justify-between items-center hover:bg-bg-surface  cursor-pointer">
                <div className="flex gap-3 items-center">
                  <Link href={'/orders'}>All orders</Link>
                </div>
                <ChevronRight size={16}/>
              </li>

              <li className="p-4 flex justify-between items-center hover:bg-bg-surface cursor-pointer">
                <div className="flex gap-3 items-center">
                  <Link href={'/notAvailable'}>Support/Help</Link>
                </div>
                <ChevronRight size={16}/>
              </li>

              <li className="p-4 flex justify-between items-center hover:bg-bg-surface cursor-pointer">
                <div className="flex gap-3 items-center">
                  <Link href={'/notAvailable'}>Reports</Link>
                </div>
                <ChevronRight size={16}/>
              </li>
            </ul>
          </div>  

          <div className="border-t border-border px-4 py-2 w-full h-full rounded-b-xl flex items-center justify-between">
            {/* Theme Switcher */}
            <ThemeToggle />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="
                px-3 py-2 text-negative 
                font-medium p-2 rounded-lg hover:bg-bg-surface
              "
            >
              Log out
            </button>
          </div>   
        </div>
      )}
    </div>
  );
}
