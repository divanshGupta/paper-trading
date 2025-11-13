"use client";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() =>
        setTheme(theme === "light" ? "dark" : "light")
      }
      className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      Toggle
    </button>
  );
}
