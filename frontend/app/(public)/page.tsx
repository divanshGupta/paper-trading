"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

// ==========================================
// ANIMATION VARIANTS (Properly Typed)
// ==========================================

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] // Custom ease for smooth Gen Z feel
    }
  }
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

// ==========================================
// COMPONENT
// ==========================================

export default function Home() {
  const shouldReduce = useReducedMotion();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  // Respect reduced motion preference
  const getTransition = (delay: number = 0) => {
    if (shouldReduce) {
      return { duration: 0 };
    }
    return { 
      duration: 0.6, 
      delay, 
      ease: [0.22, 1, 0.36, 1] as const
    };
  };

  return (
    <main className="dark bg-[var(--color-bg)] text-[var(--color-text)] overflow-x-hidden selection:bg-[var(--color-brand)] selection:text-black">

      {/* ================= NAVBAR ================= */}
      <motion.nav
        initial={{ y: -20, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        transition={getTransition()}
        className="fixed top-4 left-1/2 z-50 w-[92%] max-w-5xl
                  rounded-2xl backdrop-blur-2xl bg-white/5 border border-white/10 
                  px-4 py-2.5 md:px-6 md:py-3.5 flex items-center justify-between shadow-lg shadow-black/5"
      >
        <span className="font-bold text-lg md:text-xl tracking-tight">
          <span className="text-[var(--color-brand)]">Sim</span>Trading
        </span>

        <div className="hidden md:flex gap-8 text-sm font-medium text-[var(--color-text-secondary)]">
          <a href="#features" className="hover:text-[var(--color-text)] transition-colors duration-200">Features</a>
          <a href="#how-it-works" className="hover:text-[var(--color-text)] transition-colors duration-200">How it works</a>
          <a href="#faq" className="hover:text-[var(--color-text)] transition-colors duration-200">FAQs</a>
        </div>

        <Link 
          href="/login"
          className="bg-[var(--color-brand)] text-black px-5 py-2.5 rounded-xl 
                   font-semibold shadow-[0_0_20px_var(--color-brand-glow)] 
                   hover:shadow-[0_0_30px_var(--color-brand-glow)] 
                   hover:scale-105 transition-all duration-300"
        >
          Try Free
        </Link>
      </motion.nav>

      {/* ================= HERO ================= */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-28 md:pt-24 relative">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-brand)]/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[var(--color-blue)]/10 rounded-full blur-[96px] pointer-events-none" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-5xl text-center relative z-10"
        >
          <motion.div 
            variants={fadeUp}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full 
                      bg-gradient-to-r from-[var(--color-positive-soft)] to-transparent
                      border border-[var(--color-positive)]/20 text-[var(--color-positive)] 
                      mb-8 text-xs font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-positive)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-positive)]"></span>
            </span>
            Get ₹1,00,000 Virtual Trading Capital
          </motion.div>

          <motion.h1 
            variants={fadeUp}
            className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight"
          >
            Learn Stock Trading{" "}
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-light)] bg-clip-text text-transparent">
              Without Losing ₹1
            </span>
          </motion.h1>

          <motion.p 
            variants={fadeUp}
            className="mt-8 text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed"
          >
            Practice delivery & intraday trading with live-like market behavior —
            zero risk, 100% learning.
          </motion.p>

          <motion.div 
            variants={fadeUp}
            className="mt-12 flex flex-col md:flex-row gap-4 justify-center items-center"
          >
            <Link 
              href="/login"
              className="group bg-[var(--color-brand)] text-black px-6 py-3 md:px-8 md:py-4 rounded-2xl 
                       font-bold text-lg shadow-[0_0_30px_var(--color-brand-glow)]
                       hover:shadow-[0_0_50px_var(--color-brand-glow)] 
                       hover:scale-105 transition-all duration-300
                       flex items-center gap-2"
            >
              Start Free
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <button className="px-6 py-3 md:px-8 md:py-4 rounded-2xl border border-white/20 hover:border-white/40 
                             hover:bg-white/5 transition-all duration-300 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              See How It Works
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div 
            variants={fadeUp}
            className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {[
              { value: "₹1L+", label: "Virtual Capital" },
              { value: "0₹", label: "Real Risk" },
              { value: "100%", label: "Learning" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[var(--color-brand)]">{stat.value}</div>
                <div className="text-sm text-[var(--color-text-secondary)] mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ================= WHY LEARN ================= */}
      <section className="px-6 py-16 relative" id="features">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <span className="text-[var(--color-brand)] font-semibold text-sm uppercase tracking-wider">Why Us</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 tracking-tight">
              Why Learn Trading First?
            </h2>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[
              { 
                icon: "🧠", 
                title: "Avoid Emotional Mistakes", 
                desc: "Learn to control FOMO and panic selling without real consequences" 
              },
              { 
                icon: "📊", 
                title: "Understand Market Behavior", 
                desc: "Watch how markets move and learn to read trends like a pro" 
              },
              { 
                icon: "🛡️", 
                title: "Build Confidence Safely", 
                desc: "Make mistakes, learn from them, and level up your skills risk-free" 
              },
              { 
                icon: "⚡", 
                title: "Master Risk Management", 
                desc: "Discover position sizing and stop-loss strategies that save real money" 
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={scaleUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group p-8 rounded-3xl bg-gradient-to-br from-[var(--color-bg-surface)] to-transparent
                         border border-white/5 hover:border-[var(--color-brand)]/30
                         hover:shadow-[0_0_30px_rgba(0,230,179,0.1)]
                         transition-all duration-300"
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--color-brand)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="px-6 py-16 bg-[var(--color-bg-surface)] relative overflow-hidden" id="how-it-works">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand)]/5 rounded-full blur-[64px]" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-20"
          >
            <span className="text-[var(--color-brand)] font-semibold text-sm uppercase tracking-wider">Process</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 tracking-tight">
              How It Works
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-0.5 
                          bg-gradient-to-r from-[var(--color-brand)]/20 via-[var(--color-brand)]/40 to-[var(--color-brand)]/20" />

            {[
              { 
                step: "01", 
                title: "Get Virtual Money", 
                desc: "Start with ₹1,00,000 demo balance and zero real risk",
                icon: "💰"
              },
              { 
                step: "02", 
                title: "Trade Like Real", 
                desc: "Buy & sell with real market behavior and live price movements",
                icon: "📈"
              },
              { 
                step: "03", 
                title: "Track & Improve", 
                desc: "Analyze P&L, portfolio performance, and trading patterns",
                icon: "🚀"
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                transition={getTransition(i * 0.15)}
                className="relative text-center group"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--color-bg)] 
                              border border-[var(--color-brand)]/20 
                              flex items-center justify-center text-3xl
                              group-hover:border-[var(--color-brand)]/50 
                              group-hover:shadow-[0_0_20px_var(--color-brand-glow)]
                              transition-all duration-300 relative z-10">
                  {step.icon}
                </div>
                <div className="text-[var(--color-brand)] font-bold text-sm mb-3">{step.step}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-[var(--color-text-secondary)] max-w-xs mx-auto">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <span className="text-[var(--color-brand)] font-semibold text-sm uppercase tracking-wider">Practice</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 tracking-tight">
              What You Can Practice
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: "📦",
                title: "Delivery Trading",
                desc: "Buy stocks and hold them like real investing. Learn long-term strategies and portfolio building without any capital."
              },
              {
                icon: "⚡",
                title: "Intraday Trading",
                desc: "Practice same-day buy & sell strategies. Master entry/exit timing and quick decision making safely."
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={slideInLeft}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                transition={getTransition(i * 0.15)}
                whileHover={{ scale: 1.02 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-[var(--color-bg-surface)] to-transparent
                         border border-white/5 hover:border-[var(--color-brand)]/20
                         hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]
                         transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-[var(--color-brand)]/10 
                              flex items-center justify-center text-2xl mb-6">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="px-6 py-16 bg-[var(--color-bg-surface)]" id="faq">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <span className="text-[var(--color-brand)] font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 tracking-tight">
              Got Questions?
            </h2>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              {
                q: "Is this real money?",
                a: "Nope! All trades use virtual money. You get ₹1,00,000 demo balance to practice with zero financial risk."
              },
              {
                q: "Is this for beginners?",
                a: "Absolutely. SimTrading is designed for absolute beginners who want to learn trading without the fear of losing money."
              },
              {
                q: "Is it safe?",
                a: "100% safe. No real money, no payments, no financial risk whatsoever. Just pure learning."
              },
              {
                q: "Can I trade on mobile?",
                a: "Yes! Our platform is fully responsive and works seamlessly on your phone, tablet, or desktop."
              }
            ].map((faq, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ x: 4 }}
                className="group p-6 rounded-2xl bg-[var(--color-bg)]/50 
                         border border-white/5 hover:border-[var(--color-brand)]/20
                         transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-brand)]/10 
                                flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[var(--color-brand)] font-bold text-sm">Q</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 group-hover:text-[var(--color-brand)] transition-colors">
                      {faq.q}
                    </h4>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="px-6 py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-brand)]/5 to-transparent" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <motion.h2 
            variants={fadeUp}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            Start Learning Trading{" "}
            <span className="bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-light)] bg-clip-text text-transparent">
              the Right Way
            </span>
          </motion.h2>

          <motion.p 
            variants={fadeUp}
            className="text-xl text-[var(--color-text-secondary)] mb-12"
          >
            No fear. No losses. Just skills. Join thousands of young traders learning risk-free.
          </motion.p>

          <motion.div variants={fadeUp}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[var(--color-brand)] text-black 
                       px-10 py-5 rounded-2xl text-lg font-bold 
                       shadow-[0_0_40px_var(--color-brand-glow)]
                       hover:shadow-[0_0_60px_var(--color-brand-glow)]
                       hover:scale-105 transition-all duration-300"
            >
              Create Free Account
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>

          <motion.p 
            variants={fadeIn}
            className="mt-6 text-sm text-[var(--color-text-secondary)]"
          >
            No credit card required. Takes 30 seconds.
          </motion.p>
        </motion.div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="px-6 py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">
              <span className="text-[var(--color-brand)]">Sim</span>Trading
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            © {new Date().getFullYear()} SimTrading. Built with ❤️ for future traders.
          </p>
          <div className="flex gap-6 text-sm text-[var(--color-text-secondary)]">
            <a href="#" className="hover:text-[var(--color-text)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--color-text)] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}