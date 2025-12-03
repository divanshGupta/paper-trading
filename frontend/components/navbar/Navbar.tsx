"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Bell } from 'lucide-react';
import ProfileDropDown from './ProfileDropDown';
import ThemeToggle from '../ui/ThemeToggle';
import StockSearch from '../stocks/StockSearch';
import { useLivePrices } from '@/app/(main)/hooks/useLivePrices';

export default function Navbar() {
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { prices } = useLivePrices();

  const navLinks = [
    { href: "/stocks", label: "Explore" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/realized-pnl", label: "Realized P&L" },
    { href: "/orders", label: "Orders" },
    { href: "/watchlist", label: "Watchlist" },
  ];

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

 return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-bg-elevated backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* Left side */}
        <div className="flex items-center gap-10">
          
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 ">
            <div className="w-7 h-7 rounded-full bg-brand" />
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
          <div className="hidden md:block">
            <StockSearch value={search} onChange={setSearch} fullList={prices}/>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button className="hidden md:block p-2 rounded-full hover:bg-bg-surface transition relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-text text-xs rounded-full px-[5px] py-[1px]">
              5
            </span>
          </button>

          {/* Avatar */}
          <ProfileDropDown />

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* we will implement ticker bar when real market data feed arrive */}
      {/* <TickerBar /> */}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div ref={menuRef} className="md:hidden border-t bg-bg-main px-4 py-3">
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
