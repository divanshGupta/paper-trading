"use client";

import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const baseBtn =
    "px-4 py-2 rounded-lg text-sm border transition-all active:scale-95";
  const enabled =
    "text-text border-border hover:bg-bg-elevated cursor-pointer";
  const disabled =
    "text-text-secondary border-border/40 cursor-not-allowed opacity-60";

  return (
    <div className="flex justify-center items-center gap-4 mt-8 select-none">

      {/* Prev */}
      <button
        onClick={() => canPrev && onPageChange(page - 1)}
        disabled={!canPrev}
        className={`${baseBtn} ${canPrev ? enabled : disabled}`}
      >
        ← Prev
      </button>

      {/* Page Indicator */}
      <span className="text-sm text-text-secondary">
        Page{" "}
        <span className="font-semibold text-text">{page}</span> of{" "}
        <span className="font-semibold text-text">{totalPages}</span>
      </span>

      {/* Next */}
      <button
        onClick={() => canNext && onPageChange(page + 1)}
        disabled={!canNext}
        className={`${baseBtn} ${canNext ? enabled : disabled}`}
      >
        Next →
      </button>
    </div>
  );
}
