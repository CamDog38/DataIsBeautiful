"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface AdSpendPayload {
  spend: number;
  revenue: number;
  roas: number;
  currency?: string;
}

export function AdSpendRevenueSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as AdSpendPayload;
  const { spend, revenue, roas, currency = "USD" } = payload;

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      AED: "د.إ",
      ZAR: "R",
      AUD: "A$",
      CAD: "C$",
    };
    return symbols[code] || "$";
  };

  const symbol = getCurrencySymbol(currency);

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `${symbol}${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${symbol}${(n / 1000).toFixed(0)}K`;
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  };

  // Calculate the visual ratio for the bars
  const maxVal = Math.max(spend, revenue);
  const spendWidth = (spend / maxVal) * 100;
  const revenueWidth = (revenue / maxVal) * 100;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-12">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_30%_30%,rgba(239,68,68,0.4),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(34,197,94,0.4),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1 }}
      />

      {/* Money particles */}
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
          {["💰", "📈", "💵", "🎯"][i % 4]}
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

        {/* Spend vs Revenue comparison */}
        <div className="space-y-6">
          {/* Ad Spend Bar */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Ad Spend</span>
              <span className="text-xl font-bold text-red-400">{formatCurrency(spend)}</span>
            </div>
            <div className="h-10 bg-white/5 rounded-xl overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500/80 to-orange-500/80 rounded-xl flex items-center justify-end pr-3"
                initial={{ width: 0 }}
                animate={{ width: `${spendWidth}%` }}
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

          {/* Revenue Bar */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Revenue Generated</span>
              <span className="text-xl font-bold text-emerald-400">{formatCurrency(revenue)}</span>
            </div>
            <div className="h-10 bg-white/5 rounded-xl overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500/80 to-teal-500/80 rounded-xl flex items-center justify-end pr-3"
                initial={{ width: 0 }}
                animate={{ width: `${revenueWidth}%` }}
                transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
              >
                <span className="text-xs font-semibold text-white/80">Return</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* ROAS Badge */}
        <motion.div
          className="mt-8 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
        >
          <div className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40">
            <div className="text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                {roas.toFixed(1)}x
              </div>
              <div className="text-sm text-emerald-400/80 mt-1">Return on Ad Spend</div>
            </div>
          </div>
        </motion.div>

        {/* Profit indicator */}
        <motion.div
          className="mt-4 text-center text-sm text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Every {symbol}1 spent returned <span className="text-emerald-400 font-bold">{symbol}{roas.toFixed(2)}</span>
        </motion.div>
      </div>
    </div>
  );
}
