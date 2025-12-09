"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  LineChart,
  Wallet,
  BarChart3,
  List,
  Star,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {

    // 🔥 Disable scroll when menu is open
  useEffect(() => {
    if (open) {
      // Prevent scrolling
      document.body.style.overflow = "hidden";
    } else {
      // Restore scrolling
      document.body.style.overflow = "";
    }

    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* SLIDING PANEL */}
          <motion.div
            className="
              fixed inset-0 z-50 
              bg-bg-main/90 
              backdrop-blur-xl 
              flex flex-col 
              px-8 pt-24 pb-10
              shadow-[0_0_30px_rgba(0,0,0,0.25)]
            "
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="
                absolute top-4 right-4
                p-2 rounded-full 
                bg-bg-surface/60 
                backdrop-blur-md 
                border border-border
                shadow-sm
                active:scale-95 transition
              "
            >
              <X className="w-6 h-6 text-text" />
            </button>

            {/* Menu Items */}
            <nav className="mt-4 space-y-6 font-medium ">
              <MenuItem href="/stocks" icon={<LineChart />} onClose={onClose}>
                Explore
              </MenuItem>

              <MenuItem href="/portfolio" icon={<Wallet />} onClose={onClose}>
                Portfolio
              </MenuItem>

              <MenuItem href="/realized-pnl" icon={<BarChart3 />} onClose={onClose}>
                Realized P&L
              </MenuItem>

              <MenuItem href="/watchlist" icon={<Star />} onClose={onClose}>
                Watchlist
              </MenuItem>

              <MenuItem href="/orders" icon={<List />} onClose={onClose}>
                Orders
              </MenuItem>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------
    Menu Item Component (consistent UI)
------------------------------------------- */
function MenuItem({
  href,
  icon,
  children,
  onClose,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}) {
    
    const router = useRouter();

    const handleClick = () => {
        router.push(href);

        // smooth delay so animation doesn't feel abrupt
        setTimeout(() => {
        onClose();
        }, 220); // tweak 150–250ms for perfect UX
  };

  return (
    <button
        onClick={handleClick}
        className="
            flex items-center gap-4 
            text-xl text-text 
            py-3 rounded-xl 
            active:scale-[0.97] 
            transition-all 
            hover:bg-bg-surface/30 
            border border-transparent 
            hover:border-border
        "
    >
      <span className="text-primary">{icon}</span>
      <span>{children}</span>
    </button>
  );
}
