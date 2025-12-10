"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface OptimizationPayload {
  lowestCpr: number;
  highestCtr: number;
  lowestCpc: number;
  bestCpm: number;
  topResultsDay?: string;
  topResultsDayCount?: number;
  currency?: string;
}

export function OptimizationWinsSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as OptimizationPayload;
  const { lowestCpr, highestCtr, lowestCpc, bestCpm, topResultsDay, topResultsDayCount, currency = "USD" } = payload;

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

  const wins = [
    {
      icon: "🎯",
      label: "Lowest CPR",
      value: `${symbol}${lowestCpr.toFixed(2)}`,
      description: "Your most efficient cost per result",
      color: "from-emerald-400 to-teal-500",
    },
    {
      icon: "📈",
      label: "Highest CTR",
      value: `${highestCtr.toFixed(2)}%`,
      description: "Your best click-through rate",
      color: "from-blue-400 to-cyan-500",
    },
    {
      icon: "💰",
      label: "Lowest CPC",
      value: `${symbol}${lowestCpc.toFixed(2)}`,
      description: "Your cheapest cost per click",
      color: "from-amber-400 to-orange-500",
    },
    {
      icon: "👁️",
      label: "Best CPM",
      value: `${symbol}${bestCpm.toFixed(2)}`,
      description: "Your most efficient impressions cost",
      color: "from-purple-400 to-pink-500",
    },
  ];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-10">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_30%,rgba(34,197,94,0.4),transparent_50%),radial-gradient(circle_at_50%_70%,rgba(59,130,246,0.3),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
      />

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

        {/* Wins grid */}
        <div className="grid grid-cols-2 gap-4">
          {wins.map((win, i) => (
            <motion.div
              key={win.label}
              className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
            >
              <motion.div
                className="text-3xl mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
              >
                {win.icon}
              </motion.div>
              <div className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${win.color}`}>
                {win.value}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                {win.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Top results day highlight */}
        {topResultsDay && topResultsDayCount && topResultsDayCount > 0 && (
          <motion.div
            className="mt-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="text-xs text-amber-400/80 uppercase tracking-wider mb-1">
              🏆 Top Results Day
            </div>
            <div className="text-lg font-bold text-white">{topResultsDay}</div>
            <div className="text-sm text-amber-400">
              {topResultsDayCount.toLocaleString()} results in a single day
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
