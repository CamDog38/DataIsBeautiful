"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface EfficiencyPayload {
  cpa: number;
  cpc: number;
  cpm: number;
  ctr: number;
  bestMonth: string;
  bestMonthCpa: number;
  yoyCpaChange: number;
  yoyRoasChange: number;
  currency?: string; // ISO code like USD, ZAR
}

export function EfficiencyTrendsSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as EfficiencyPayload;
  const { cpa, cpc, cpm, ctr, bestMonth, bestMonthCpa, yoyCpaChange, yoyRoasChange, currency = "USD" } = payload;

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

  const metrics = [
    { label: "Avg CPR", value: `${symbol}${cpa?.toFixed(2) || "0"}`, trend: yoyCpaChange, goodWhenDown: true },
    { label: "Avg CPC", value: `${symbol}${cpc?.toFixed(2) || "0"}`, trend: null, goodWhenDown: true },
    { label: "Avg CPM", value: `${symbol}${cpm?.toFixed(2) || "0"}`, trend: null, goodWhenDown: true },
    { label: "Avg CTR", value: `${ctr?.toFixed(2) || "0"}%`, trend: null, goodWhenDown: false },
  ];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-10">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_50%,rgba(34,197,94,0.4),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.3),transparent_50%)]"
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

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="text-xs text-slate-500 uppercase tracking-wider">{metric.label}</div>
              <div className="text-2xl font-bold text-white mt-1">{metric.value}</div>
              {metric.trend !== null && metric.trend !== 0 && (
                <div className={`text-xs mt-1 ${
                  (metric.goodWhenDown && metric.trend < 0) || (!metric.goodWhenDown && metric.trend > 0)
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}>
                  {metric.trend > 0 ? "↑" : "↓"} {Math.abs(metric.trend).toFixed(1)}% YoY
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Best month highlight */}
        {bestMonth && (
          <motion.div
            className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-400/80 uppercase tracking-wider">Most Efficient Month</div>
                <div className="text-xl font-bold text-white">{bestMonth}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">{`${symbol}${bestMonthCpa?.toFixed(2) || "0"}`}</div>
                <div className="text-xs text-slate-500">CPR</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* YoY changes */}
        <motion.div
          className="flex justify-center gap-8 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {yoyCpaChange !== 0 && (
            <div className="text-center">
              <div className={`text-lg font-bold ${yoyCpaChange < 0 ? "text-emerald-400" : "text-red-400"}`}>
                {yoyCpaChange > 0 ? "+" : ""}{yoyCpaChange?.toFixed(1) || 0}%
              </div>
              <div className="text-xs text-slate-500">CPR vs Last Year</div>
            </div>
          )}
          {yoyRoasChange !== 0 && (
            <div className="text-center">
              <div className={`text-lg font-bold ${yoyRoasChange > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {yoyRoasChange > 0 ? "+" : ""}{yoyRoasChange?.toFixed(1) || 0}%
              </div>
              <div className="text-xs text-slate-500">ROAS vs Last Year</div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
