import React from "react";

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex justify-center items-center gap-3 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={`px-3 py-1 border rounded-lg text-sm ${
          page <= 1
            ? "text-gray-400 border-gray-300 cursor-not-allowed"
            : "hover:bg-gray-100"
        }`}
      >
        ← Prev
      </button>

      <span className="text-sm text-gray-700">
        Page <span className="font-semibold">{page}</span> of{" "}
        <span className="font-semibold">{totalPages}</span>
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={`px-3 py-1 border rounded-lg text-sm ${
          page >= totalPages
            ? "text-gray-400 border-gray-300 cursor-not-allowed"
            : "hover:bg-gray-100"
        }`}
      >
        Next →
      </button>
    </div>
  );
}
