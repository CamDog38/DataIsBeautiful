"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface AdSpendLeadsPayload {
  spend: number;
  leads: number;
  cpl: number;
  currency?: string;
}

export function AdSpendLeadsSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as AdSpendLeadsPayload;
  const { spend, leads, cpl, currency = "USD" } = payload;

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", AED: "د.إ", ZAR: "R", AUD: "A$", CAD: "C$"
    };
    return symbols[code] || "$";
  };

  const symbol = getCurrencySymbol(currency);

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `${symbol}${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${symbol}${(n / 1000).toFixed(0)}K`;
    return `${symbol}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-12">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.4),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(6,182,212,0.4),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1 }}
      />

      {/* Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -30] }}
          transition={{ duration: 2.5, delay: i * 0.2, repeat: Infinity, repeatDelay: 2 }}
        >
          {["💰", "🎯", "📊", "✨"][i % 4]}
        </motion.div>
      ))}

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
          {slide.subtitle && (
            <p className="text-sm text-slate-400 mt-1">{slide.subtitle}</p>
          )}
        </motion.div>

        {/* Spend and Leads comparison */}
        <div className="space-y-6">
          {/* Ad Spend */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Total Ad Spend</span>
              <span className="text-xl font-bold text-blue-400">{formatCurrency(spend)}</span>
            </div>
            <div className="h-10 bg-white/5 rounded-xl overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500/80 to-indigo-500/80 rounded-xl flex items-center justify-end pr-3"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              >
                <span className="text-xs font-semibold text-white/80">Investment</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Arrow indicator */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-3xl">↓</div>
          </motion.div>

          {/* Results Generated */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Results Generated</span>
              <span className="text-xl font-bold text-cyan-400">{formatNumber(leads)}</span>
            </div>
            <div className="h-10 bg-white/5 rounded-xl overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500/80 to-teal-500/80 rounded-xl flex items-center justify-end pr-3"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
              >
                <span className="text-xs font-semibold text-white/80">Results</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* CPL Highlight */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-400/30">
            <div className="text-4xl font-bold text-cyan-400">{formatCurrency(cpl)}</div>
            <div className="text-sm text-slate-400 mt-1">Cost per Result</div>
          </div>
        </motion.div>

        {/* Summary */}
        <motion.p
          className="text-center text-sm text-slate-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Every {formatCurrency(cpl)} spent generated <span className="text-cyan-400 font-semibold">1 result</span>
        </motion.p>
      </div>
    </div>
  );
}
