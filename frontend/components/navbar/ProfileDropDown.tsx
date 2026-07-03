"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers/AppProvider";
import ThemeToggle from "../ui/ThemeToggle";
import {
  ChevronRight,
  Settings,
  LogOut,
  TrendingUp,
  Wallet,
  Crown,
} from "lucide-react";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { state } = useApp();
  const { profile } = state;
  const name = profile?.name || "User";
  const email = profile?.email || "";
  const initials = name.charAt(0).toUpperCase();

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function closeMenu() {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 200);
  }

  // logout
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    closeMenu();
    setTimeout(() => {
      logout();
      router.replace("/login");
    }, 200);
  }

  const menuItems = [
    {
      href: "/orders",
      label: "All Orders",
      description: "View your order history",
      accent: "var(--color-blue)",
      bgAccent: "rgba(59, 130, 246, 0.1)",
    },
    {
      href: "/notAvailable",
      label: "Support & Help",
      description: "Get assistance",
      accent: "var(--color-yellow)",
      bgAccent: "rgba(234, 88, 12, 0.1)",
    },
    {
      href: "/notAvailable",
      label: "Reports",
      description: "Analytics & insights",
      accent: "var(--color-purple)",
      bgAccent: "rgba(124, 58, 237, 0.1)",
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => (open ? closeMenu() : setOpen(true))}
        className={`
          relative w-10 h-10 rounded-full flex items-center justify-center
          text-sm font-bold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          hover:scale-110 active:scale-95
          ${open ? "ring-2 ring-[var(--color-brand)] ring-offset-2 ring-offset-[var(--color-bg)]" : ""}
        `}
        style={{
          background: open
            ? "linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))"
            : "var(--color-bg-elevated)",
          color: open ? "white" : "var(--color-text)",
        }}
      >
        {initials}

      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`
            absolute right-0 mt-3 w-64
            rounded-2xl z-50 overflow-hidden
            border border-[var(--color-border)]
            shadow-4xl shadow-black
            transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${isClosing ? "opacity-0 scale-95 translate-y-1" : "opacity-100 scale-100 translate-y-0"}
          `}
          style={{
            backgroundColor: "var(--color-bg-surface)",
            backdropFilter: "blur(20px)",
          }}
        >

          <div className="relative overflow-hidden">

            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}

                  <div className="min-w-0">
                    <Link
                      href="/profile"
                      onClick={closeMenu}
                      className="group flex items-center gap-1.5"
                    >
                      <span
                        className="text-base font-bold truncate block hover:text-[var(--color-brand)] transition-colors duration-200"
                        style={{ color: "var(--color-text)" }}
                      >
                        {name}
                      </span>
                      <Crown className="w-3.5 h-3.5 text-[var(--color-yellow)] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </Link>
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {email}
                    </p>
                  </div>
                </div>

                <Link
                  href="/profile"
                  onClick={closeMenu}
                  className="p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    color: "var(--color-text-secondary)",
                    backgroundColor: "var(--color-bg-elevated)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-brand)";
                    e.currentTarget.style.backgroundColor =
                      "var(--color-brand-light)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                    e.currentTarget.style.backgroundColor =
                      "var(--color-bg-elevated)";
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "var(--color-bg)" }}
                >
                  <Wallet className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                  <div>
                    <p
                      className="text-[10px] font-medium uppercase tracking-wider"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Balance
                    </p>
                    <p
                      className="text-xs font-bold"
                      style={{ color: "var(--color-text)" }}
                    >
                      ₹{Number(profile?.balance || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "var(--color-bg)" }}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--color-positive)]" />
                  <div>
                    <p
                      className="text-[10px] font-medium uppercase tracking-wider"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Portfolio
                    </p>
                    <p
                      className="text-xs font-bold"
                      style={{ color: "var(--color-positive)" }}
                    >
                      Active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            className="h-px mx-5"
            style={{ backgroundColor: "var(--color-border)" }}
          />

          {/* Menu Items */}
          <div className="p-2">
            <ul className="space-y-0.5">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      color: "var(--color-text)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-bg-elevated)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 shrink-0 transition-all duration-200 group-hover:translate-x-0.5"
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div
            className="border-t p-3 flex items-center justify-between gap-3"
            style={{ borderColor: "var(--color-border)" }}
          >
            <ThemeToggle />

            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-md active:scale-95 flex-1 justify-center"
              style={{
                backgroundColor: "var(--color-negative-soft)",
                color: "var(--color-negative)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-negative)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-negative-soft)";
                e.currentTarget.style.color = "var(--color-negative)";
              }}
            >
              <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}