// components/ThemeToggle.tsx
import { MoonIcon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {theme === "light" ? <MoonIcon size={18} /> : <Sun size={18} />}
              </button>
  );
}