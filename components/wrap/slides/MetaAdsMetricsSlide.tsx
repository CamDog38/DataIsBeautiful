"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface MetricsPayload {
  impressions: number;
  clicks: number;
  results: number;
  ctr: number;
  cpc: number;
  cpr: number;
  cpm: number;
  currency?: string;
}

export function MetaAdsMetricsSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as MetricsPayload;
  const { impressions, clicks, results, ctr, cpc, cpr, cpm, currency = "USD" } = payload;

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

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  const metrics = [
    { label: "Impressions", value: formatNumber(impressions), icon: "👁️", color: "from-blue-400 to-cyan-400" },
    { label: "Clicks", value: formatNumber(clicks), icon: "👆", color: "from-purple-400 to-pink-400" },
    { label: "Results", value: formatNumber(results), icon: "🎯", color: "from-emerald-400 to-teal-400" },
    { label: "CTR", value: `${ctr.toFixed(2)}%`, icon: "📊", color: "from-amber-400 to-orange-400" },
    { label: "CPC", value: `${symbol}${cpc.toFixed(2)}`, icon: "💵", color: "from-rose-400 to-red-400" },
    { label: "CPR", value: `${symbol}${cpr.toFixed(2)}`, icon: "🏷️", color: "from-indigo-400 to-violet-400" },
  ];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-10">
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.35),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(99,102,241,0.25),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
      />

      <motion.div
        className="absolute top-4 right-4 flex items-center gap-2 text-xs text-slate-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[10px] font-bold">f</span>
        <span className="ml-1 font-medium">Meta Ads</span>
      </motion.div>

      <div className="relative z-10 w-full max-w-2xl">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
          {slide.subtitle && <p className="text-sm text-slate-400 mt-1">{slide.subtitle}</p>}
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08, type: "spring" }}
            >
              <motion.div
                className="text-3xl mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.08, type: "spring" }}
              >
                {metric.icon}
              </motion.div>
              <div className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${metric.color}`}>
                {metric.value}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{metric.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <span className="text-blue-400">{formatNumber(impressions)} seen</span>
          <span>→</span>
          <span className="text-purple-400">{formatNumber(clicks)} clicked</span>
          <span>→</span>
          <span className="text-emerald-400">{formatNumber(results)} results</span>
          <span className="hidden">{cpm}</span>
        </motion.div>
      </div>
    </div>
  );
}
