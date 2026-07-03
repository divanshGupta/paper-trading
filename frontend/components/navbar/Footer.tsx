"use client";

import Link from "next/link";
import { Github, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { label: "Policy", href: "/policy" },
    { label: "GitHub", href: "https://github.com/divanshGupta/paper-trading" }
  ];

  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--color-brand)" }}
            >
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span
              className="text-base font-semibold tracking-tight"
              style={{ color: "var(--color-text)" }}
            >
              SimTrading
            </span>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--color-bg-elevated)";
                  e.currentTarget.style.color = "var(--color-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Meta — Refined with animation */}
          <div className="flex items-center gap-3">
            {/* Pulse dot */}
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: "var(--color-brand)" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: "var(--color-brand)" }}
              />
            </span>

            <p
              className="text-xs sm:text-sm font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {currentYear} SimTrading
              <span className="mx-2" style={{ color: "var(--color-border)" }}>
                /
              </span>

              {/* Author */}
              <a
              href="https://divyanshgupta.vercel.app"
                className="group inline-flex items-center gap-1 cursor-default"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                <span>Divyansh Gupta</span>
                <span
                  className="inline-block opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out"
                  style={{ color: "var(--color-brand)" }}
                >
                  ;)
                </span>
              </a>
              <span className="mx-2" style={{ color: "var(--color-border)" }}>
                /
              </span>
              <a
                href="https://github.com/divanshGupta/paper-trading"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 transition-colors duration-150 hover:underline underline-offset-4"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-brand)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </a>
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}