"use client";

import { motion, Variants } from "framer-motion";
import { RefreshCw, Server } from "lucide-react";

export default function ServerErrorPage() {
  const handleRetry = () => {
    window.location.reload();
  };

  // ✅ Properly typed variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 12 },
    },
  };

  const iconVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0, rotate: -10 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 80, damping: 10 },
    },
    hover: {
      y: [-2, 2, -2],
      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
    },
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden relative"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <motion.div
          className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--color-brand-glow), transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--color-brand-glow), transparent 70%)",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <motion.div
        className="text-center max-w-md mx-auto px-6 relative z-10"
        variants={itemVariants}
      >
        {/* Animated Server Icon */}
        <motion.div
          className="flex justify-center mb-8"
          variants={iconVariants}
          initial="hidden"
          animate={["visible", "pulse"]}
          whileHover="hover"
        >
          <div
            className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-lg"
            style={{ boxShadow: "0 8px 32px var(--color-brand-glow)" }}
          >
            <Server
              className="w-12 h-12 text-[var(--color-brand)]"
              strokeWidth={1.5}
            />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="text-3xl md:text-4xl font-bold mb-3 tracking-tight"
          variants={itemVariants}
        >
          Server Unavailable
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-[var(--color-text-secondary)] mb-8 leading-relaxed"
          variants={itemVariants}
        >
          We&apos;re experiencing connectivity issues. Our team is on it — try
          again in a moment.
        </motion.p>

        {/* Retry Button */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <motion.button
            onClick={handleRetry}
            className="group flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-medium transition-all duration-300"
            style={{
              background: "var(--color-brand)",
              color: "#0d1117",
              boxShadow: "0 4px 14px var(--color-brand-glow)",
            }}
            whileHover={{
              boxShadow: "0 6px 20px var(--color-brand-glow)",
              y: -2,
            }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0, ease: "linear" }}
              whileHover={{ rotate: 180, transition: { duration: 0.4 } }}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.span>
            <span>Retry Connection</span>
          </motion.button>
        </motion.div>

        {/* Optional: Status hint */}
        <motion.div
          className="mt-10 flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)]"
          variants={itemVariants}
        >
          <motion.span
            className="w-2 h-2 rounded-full bg-[var(--color-negative)]"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span>Checking connection...</span>
        </motion.div>
      </motion.div>

      {/* Decorative floating particles (minimal) */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: "var(--color-brand)",
            opacity: 0.3,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}