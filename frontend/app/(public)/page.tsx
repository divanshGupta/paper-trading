"use client";
import { motion } from "framer-motion";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export const dynamic = "force-static"; // disables HMR for this page

export default function Home() {

  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      if (data.session?.user) {
        // auto redirect if logged in
        router.push("/dashboard")
      }
    })
  }, [router])


  return (
<div className="bg-bg-main text-text min-h-screen flex flex-col">

      {/* ---------------- HERO SECTION ---------------- */}
      <section className="pt-24 pb-32 px-6 max-w-7xl mx-auto text-center">
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-extrabold"
        >
          Learn Trading the <span className="text-brand">Smart Way</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-text-secondary text-lg md:text-xl max-w-2xl mx-auto"
        >
          Practice live intraday & delivery trading with real market data —
          fully risk-free. Designed for beginners, built for Gen-Z traders.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex justify-center"
        >
          <Link
            href="/login"
            className="bg-brand hover:bg-brand-dark text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-[0_0_25px_var(--color-brand-glow)] transition-all"
          >
            Start Trading
          </Link>
        </motion.div>

        {/* Mockup Placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 w-full flex justify-center"
        >
          <div className="w-full max-w-4xl h-80 md:h-[420px] bg-bg-surface border border-border rounded-2xl shadow-lg flex items-center justify-center text-text-secondary">
            <span>📸 App Screenshot Mockup Placeholder</span>
          </div>
        </motion.div>
      </section>

      {/* ---------------- FEATURES SECTION ---------------- */}
      <section className="py-24 bg-bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why <span className="text-brand">Tradesim</span>?
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            {/* Feature 1 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-6 rounded-xl bg-bg-main border border-border shadow-card"
            >
              <h3 className="text-xl font-semibold mb-3">⚡ Live Market Simulation</h3>
              <p className="text-text-secondary">
                Real-time stock prices, instant updates, and a realistic trading
                experience without risking real money.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-6 rounded-xl bg-bg-main border border-border shadow-card"
            >
              <h3 className="text-xl font-semibold mb-3">📈 Portfolio Insights</h3>
              <p className="text-text-secondary">
                Track ROI%, day P&L, holdings, and trends like a professional
                trader — all beautifully visualized.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-6 rounded-xl bg-bg-main border border-border shadow-card"
            >
              <h3 className="text-xl font-semibold mb-3">🎯 Beginner Friendly</h3>
              <p className="text-text-secondary">
                Clean UI, simple actions, and no distractions. Learning the
                markets has never been easier.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ---------------- SCREENSHOTS SECTION ---------------- */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
          Explore the <span className="text-brand">Experience</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-10">

          {/* Screenshot Placeholder 1 */}
          <div className="bg-bg-surface border border-border rounded-xl h-72 flex items-center justify-center text-text-secondary shadow-card">
            📸 Dashboard Screenshot Placeholder
          </div>

          {/* Screenshot Placeholder 2 */}
          <div className="bg-bg-surface border border-border rounded-xl h-72 flex items-center justify-center text-text-secondary shadow-card">
            📸 Stock Info Page Screenshot Placeholder
          </div>

        </div>
      </section>

      {/* ---------------- CTA FOOTER ---------------- */}
      <section className="py-24 bg-bg-surface border-t border-border">
        <div className="max-w-xl mx-auto text-center px-6">

          <h2 className="text-3xl font-bold mb-4">
            Ready to Begin Your Trading Journey?
          </h2>

          <p className="text-text-secondary mb-8">
            Join thousands of learners using Tradesim to master the stock market
            safely, smartly, and confidently.
          </p>

          <Link
            href="/login"
            className="bg-brand hover:bg-brand-dark text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-[0_0_25px_var(--color-brand-glow)] transition-all"
          >
            Start Trading Free
          </Link>

        </div>
      </section>

    </div>
  );
}
