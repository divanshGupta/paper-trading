export default function Footer() {
  return (
    <footer className="border-t bg-white dark:bg-[#1A212B] py-6 mt-10">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500" />
          <span className="font-semibold text-lg">TradeSim</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <a href="#" className="hover:text-teal-600 dark:hover:text-teal-400">About</a>
          <a href="#" className="hover:text-teal-600 dark:hover:text-teal-400">Privacy</a>
          <a href="#" className="hover:text-teal-600 dark:hover:text-teal-400">Terms</a>
          <a href="#" className="hover:text-teal-600 dark:hover:text-teal-400">Support</a>
        </div>

        {/* Copyright */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} TradeSim • For education & simulation only
        </p>
      </div>
    </footer>
  );
}
