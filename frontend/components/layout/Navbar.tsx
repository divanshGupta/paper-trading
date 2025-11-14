"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Menu, X, Bell, Search, Sun, Moon } from 'lucide-react';
import TickerBar from '../dashboard/StockTicker';

export default function Navbar() {

  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Explore" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/realized-pnl", label: "Realized P&L" },
    { href: "/orders", label: "Orders" },
    { href: "/watchlist", label: "Watchlist" },
  ];

 return (
    <nav className="fixed top-0 left-0  w-full z-50 bg-white/80 dark:bg-[#1A212B]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between">
        
        {/* Left side */}
        <div className="flex items-center gap-10">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 ">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500" />
            <span className="font-semibold text-xl">TradeSim</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-md font-medium transition-colors pb-1 ${
                  pathname === link.href
                    ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500"
                    : "text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Search bar */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">
            <Search size={16} className="text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search stocks..."
              className="bg-transparent focus:outline-none text-sm w-40 dark:text-gray-200"
            />
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-[5px] py-[1px]">
              5
            </span>
          </button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden cursor-pointer">
            <Link href="/profile">
              <img
                src="https://i.pravatar.cc/300"
                alt="user"
                className="w-full h-full object-cover"
              />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <TickerBar />

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white dark:bg-[#1A212B] px-4 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block py-2 text-sm ${
                pathname === link.href
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
