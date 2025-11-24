"use client";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Price } from "@/types";

interface StockSearchProps {
  value: string;
  onChange: (v: string) => void;
  fullList?: Price[];
}

export default function StockSearch({ value, onChange, fullList = [] }: StockSearchProps) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<Price[]>([]);

  // KEEP LOCAL STATE SYNCED WITH PARENT
  useEffect(() => {
    setInput(value);
  }, [value]);

  // DEBOUNCED CHANGE — only notify parent after 200ms
  useEffect(() => {
    const t = setTimeout(() => onChange(input), 200);
    return () => clearTimeout(t);
  }, [input, onChange]);

  // SEARCH SUGGESTIONS
  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    const q = input.toLowerCase();

    const matches = fullList
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name?.toLowerCase().includes(q)
      )
      .slice(0, 5);

    setSuggestions(matches);
  }, [input, fullList]);

  return (
    <div className="relative w-full md:w-64">
      <Search className="absolute left-3 top-2.5 h-5 w-5 text-text" />

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search stocks..."
        className="w-full pl-10 pr-3 py-2 rounded-lg border border-border 
                   bg-bg-main text-sm text-text"
      />

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-bg-main 
                        shadow-lg rounded-lg border border-border
                        z-20">
          {suggestions.map((s) => (
            <Link
              key={s.symbol}
              href={`/stocks/${s.symbol}`}
              className="block px-3 py-2 text-sm cursor-pointer hover:bg-bg-elevated">
              <div className="font-semibold text-text">{s.symbol}</div>
              <div className="text-xs text-text-secondary">{s.name}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
