"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/AppProvider";

interface WatchlistButtonProps {
  symbol: string;
  alwaysVisible?: boolean;
}

export default function WatchlistButton({ symbol, alwaysVisible }: WatchlistButtonProps) {
  const { watchlist, toggleWatchlist } = useApp();
  const isInWatchlist = watchlist.includes(symbol);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWatchlist(symbol);

        toast.success(
          isInWatchlist
            ? `${symbol} removed from watchlist`
            : `${symbol} added to watchlist`
        );
      }}
      className={`absolute right-2 top-2
        p-1.5 rounded-full
        bg-bg-surface
        hover:bg-bg-surface
        transition shadow-md
        ${alwaysVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
      `}
    >
      {isInWatchlist ? (
        <BookmarkCheck size={20} className="text-positive" />
      ) : (
        <Bookmark size={20} className="text-gray-500" />
      )}
    </button>
  );
}
