"use client";
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
}

export const dynamic = "force-static"; // disables HMR for this page

export default function Home() {

  const shouldReduce = useReducedMotion();

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
    <main className="dark bg-[var(--color-bg)] text-[var(--color-text)] overflow-x-hidden">

      {/* ================= NAVBAR ================= */}
      <motion.nav
        // Move the horizontal centering into Framer Motion
        initial={{ y: -20, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        
        // Use left-1/2 but remove -translate-x-1/2 from className
        className="fixed top-4 left-1/2 z-50 w-[92%] 
                  rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 
                  px-6 py-3 flex items-center justify-between"
      >
        <span className="font-bold text-lg">SimTrading</span>

        <div className="hidden md:flex gap-6 text-sm text-[var(--color-text-secondary)]">
          <a href="#">How it works</a>
          <a href="#">Features</a>
          <a href="#">FAQs</a>
        </div>

        <Link 
        href="/login"
        className="bg-[var(--color-brand)] text-black px-5 py-2 rounded-xl 
        font-semibold shadow-[0_0_20px_var(--color-brand-glow)]">
          Try Free
        </Link>
      </motion.nav>

      {/* ================= HERO ================= */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-24">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={shouldReduce ? { duration: 0 } : { duration: 0.7 }}
          className="max-w-5xl text-center"
        >
          <div className="inline-flex items-center gap-2 px-2 py-1 md:px-6 md:py-2 rounded-full 
          bg-[var(--color-positive-soft)] text-[var(--color-positive)] mb-6">
            🎁 Get ₹1,00,000 Virtual Trading Capital
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Learn Stock Trading <br className="hidden md:block" />
            <span className="text-[var(--color-brand)]">Without Losing ₹1</span>
          </h1>

          <p className="mt-6 text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Practice delivery & intraday trading with live-like market behavior —
            zero risk, 100% learning.
          </p>

          <div className="mt-10 flex flex-col md:flex-row gap-4 justify-center">
            <Link 
            href="/login"
            className="bg-[var(--color-brand)] text-black px-8 py-4 rounded-2xl 
            font-bold shadow-[0_0_30px_var(--color-brand-glow)]">
              Start Free
            </Link>
            <button className="px-8 py-4 rounded-2xl border border-white/20">
              See How It Works
            </button>
          </div>
        </motion.div>
      </section>

      {/* ================= WHY LEARN ================= */}
      <section className="px-6 py-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          Why Learn Trading First?
        </motion.h2>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            'Avoid emotional mistakes',
            'Understand market behavior',
            'Build confidence safely',
            'Learn risk management'
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-2xl"
            >
              <p className="text-lg">{item}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="px-6 py-24 bg-[var(--color-bg-surface)]">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-16"
        >
          How It Works
        </motion.h2>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Get Virtual Money', desc: 'Start with ₹1,00,000 demo balance' },
            { title: 'Trade Like Real Market', desc: 'Buy & sell with real behavior' },
            { title: 'Track & Improve', desc: 'P&L, portfolio & learning' }
          ].map((step, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass p-6 rounded-2xl text-center"
            >
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-[var(--color-text-secondary)]">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="px-6 py-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          What You Can Practice
        </motion.h2>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Delivery Trading',
              desc: 'Buy stocks and hold them like real investing.'
            },
            {
              title: 'Intraday Trading',
              desc: 'Practice same-day buy & sell strategies.'
            }
          ].map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="glass p-6 rounded-2xl"
            >
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-[var(--color-text-secondary)]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="px-6 py-24 bg-[var(--color-bg-surface)]">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          FAQs
        </motion.h2>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            ['Is this real money?', 'No. All trades use virtual money.'],
            ['Is this for beginners?', 'Yes, designed for absolute beginners.'],
            ['Is it safe?', '100%. No real money or payments involved.']
          ].map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="glass p-5 rounded-xl"
            >
              <p className="font-semibold">{faq[0]}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                {faq[1]}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="px-6 py-32 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">
            Start Learning Trading the Right Way
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-10">
            No fear. No losses. Just skills.
          </p>

          <Link
          href="/login"
          className="bg-[var(--color-brand)] text-black px-10 py-5 rounded-2xl 
          text-lg font-bold shadow-[0_0_40px_var(--color-brand-glow)]">
            Create Free Account
          </Link>
        </motion.div>
      </section>

    </main>
  );
}
