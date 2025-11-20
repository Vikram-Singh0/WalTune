"use client";

import { Navbar } from "@/components/Navbar";
import { useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Mic2, Wallet, ShieldCheck, Zap, Music2, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  const account = useCurrentAccount();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#4ade80] selection:text-black overflow-x-hidden font-sans">
      <Navbar />

      <main className="container mx-auto px-6 pt-32 pb-16">
        {/* Hero Section */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="mb-32 flex flex-col items-center text-center"
        >
          <motion.h1
            variants={fadeInUp}
            className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8"
          >
            Decentralized <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] to-emerald-400">Music Streaming</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed"
          >
            Fair pay for artists. Ownership for listeners. <br />
            Powered by Walrus, Sui, and x402.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex gap-4"
          >
            <Link
              href={account ? "/dashboard" : "/explore"}
              className="group bg-[#4ade80] hover:bg-[#22c55e] text-black px-8 py-3 rounded-full font-medium transition-all hover:scale-105 flex items-center gap-2"
            >
              Start Listening <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-full font-medium transition-all flex items-center gap-2 backdrop-blur-sm border border-white/10 hover:border-white/20"
            >
              For Artists
            </Link>
          </motion.div>
        </motion.div>

        {/* Problem Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-32"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">The Broken Music Economy</h2>
            <p className="text-gray-400 text-lg">Why we need a change.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Tiny Payouts", desc: "Artists earn less than ₹0.10 per stream on traditional platforms.", icon: <Wallet className="w-8 h-8 text-[#4ade80]" /> },
              { title: "Delayed Payments", desc: "Waiting 30-90 days to get paid for your work is unacceptable.", icon: <Zap className="w-8 h-8 text-[#4ade80]" /> },
              { title: "Middlemen Cuts", desc: "Platforms take 30-45% of revenue, leaving creators with crumbs.", icon: <ShieldCheck className="w-8 h-8 text-[#4ade80]" /> }
            ].map((item, i) => (
              <div key={i} className="group bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-1">
                <div className="mb-6 p-3 bg-white/5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Solution Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-32 bg-gradient-to-b from-[#4ade80]/5 to-transparent p-8 md:p-12 rounded-[3rem] border border-[#4ade80]/10"
        >
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">The WalTune Solution</h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                A decentralized, pay-per-play music streaming platform.
                Listeners preload balance, play songs, and a tiny fee is auto-sent to the artist instantly.
              </p>
              <ul className="space-y-4">
                {[
                  "No Subscriptions",
                  "No Intermediaries",
                  "100% Revenue to Artists",
                  "Instant Payouts"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-lg text-gray-200">
                    <CheckCircle2 className="w-6 h-6 text-[#4ade80]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-black/40 p-8 rounded-3xl border border-white/10 w-full backdrop-blur-xl">
              <div className="space-y-6 font-mono text-sm text-gray-400">
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span>Storage</span>
                  <span className="text-white">Walrus (Decentralized)</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span>Identity</span>
                  <span className="text-white">Sui Move Contracts</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span>Payments</span>
                  <span className="text-white">x402 Protocol</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span>Frontend</span>
                  <span className="text-white">Next.js + Sui SDK</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-32"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Platform Features</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-8 p-8 rounded-3xl bg-white/5 border border-white/5">
              <h3 className="text-2xl font-bold text-[#4ade80] flex items-center gap-3">
                <Mic2 className="w-6 h-6" /> For Artists
              </h3>
              <div className="space-y-4">
                {[
                  "Register on-chain identity",
                  "Upload songs to Walrus storage",
                  "Set your own per-play cost",
                  "View real-time earnings"
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                    <div className="w-1.5 h-1.5 bg-[#4ade80] rounded-full"></div>
                    <span className="text-gray-300">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8 p-8 rounded-3xl bg-white/5 border border-white/5">
              <h3 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                <Play className="w-6 h-6" /> For Listeners
              </h3>
              <div className="space-y-4">
                {[
                  "Preload wallet balance",
                  "Pay only when you play",
                  "Transparent payment history",
                  "Ad-free experience"
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer / CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="flex flex-col items-center text-center pt-24 border-t border-white/10"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to tune in?</h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl">
            Join the revolution of decentralized music streaming. Support artists directly.
          </p>
          <Link
            href="/explore"
            className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-all hover:scale-105 flex items-center gap-2"
          >
            Launch App <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="mt-24 text-gray-600 text-sm flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              © Built for the Walrus Haulout Hackathon.
            </div>
            <div className="text-gray-500">
              Built with ❤️ by DonaLabs for creators and music lovers
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
