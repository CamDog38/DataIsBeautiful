"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface MonthData {
  monthStart: string;
  spend: number;
  clicks: number;
  conversions: number;
  conversionsValue: number;
  roas: number;
  highlightLabel: string;
}

interface GoogleAdsMonthlyPayload {
  months: MonthData[];
  currency?: string;
  metric?: "roas" | "clicks" | "conversions" | "spend";
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function GoogleAdsMonthlySlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as GoogleAdsMonthlyPayload;
  const { months = [], currency = "USD", metric = "roas" } = payload;

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", AED: "د.إ", ZAR: "R", AUD: "A$", CAD: "C$",
    };
    return symbols[code] || "$";
  };

  const symbol = getCurrencySymbol(currency);

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `${symbol}${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${symbol}${(n / 1000).toFixed(0)}K`;
    return `${symbol}${n.toFixed(0)}`;
  };

  // Get month name from date string
  const getMonthName = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return MONTH_NAMES[date.getMonth()] || "";
  };

  // Get value based on metric
  const getValue = (m: MonthData) => {
    switch (metric) {
      case "roas": return m.roas || 0;
      case "clicks": return m.clicks || 0;
      case "conversions": return m.conversions || 0;
      case "spend": return m.spend || 0;
      default: return m.roas || 0;
    }
  };

  // Find max value for scaling
  const maxValue = Math.max(...months.map(getValue), 1);

  // Find highlighted month
  const highlightedMonth = months.find(m => m.highlightLabel === "HIGHEST_ROAS_MONTH");
  const avgValue = months.length > 0 ? months.reduce((sum, m) => sum + getValue(m), 0) / months.length : 0;

  return (
    <div className="relative flex h-full w-full flex-col px-8 py-6">
      {/* Google Ads branding */}
      <motion.div
        className="absolute top-4 right-4 flex items-center gap-2 text-xs text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-blue-500">●</span>
        <span className="text-red-500">●</span>
        <span className="text-yellow-500">●</span>
        <span className="text-green-500">●</span>
        <span className="ml-1 font-medium">Google Ads</span>
      </motion.div>

      {/* Title */}
      <motion.div
        className="mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-bold text-white">{slide.title}</h2>
        {slide.subtitle && (
          <p className="text-xs text-slate-400 mt-1">{slide.subtitle}</p>
        )}
      </motion.div>

      {/* Bar chart */}
      <div className="flex-1 flex items-end justify-center gap-2 px-4 pb-8">
        {months.map((month, index) => {
          const value = getValue(month);
          const barHeight = (value / maxValue) * 100;
          const isHighlighted = month.highlightLabel === "HIGHEST_ROAS_MONTH";
          const isBestClicks = month.highlightLabel === "BEST_CLICK_VOLUME_MONTH";
          const isMostExpensive = month.highlightLabel === "MOST_EXPENSIVE_MONTH";

          return (
            <motion.div
              key={month.monthStart || index}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              {/* Bar */}
              <motion.div
                className={`w-12 rounded-t-lg ${
                  isHighlighted ? "bg-gradient-to-t from-amber-500 to-yellow-400 shadow-lg shadow-amber-500/30" :
                  isBestClicks ? "bg-gradient-to-t from-blue-500 to-blue-400" :
                  isMostExpensive ? "bg-gradient-to-t from-red-500 to-red-400" :
                  "bg-slate-600/80"
                }`}
                style={{ minHeight: 8 }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(barHeight * 2, 8)}px` }}
                transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
              />
              {/* Month label */}
              <span className={`text-xs ${isHighlighted ? "text-amber-400 font-bold" : "text-slate-500"}`}>
                {getMonthName(month.monthStart)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Highlight callout */}
      {highlightedMonth && (
        <motion.div
          className="mx-auto px-6 py-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-xl border border-amber-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <div className="text-xl font-bold text-amber-400">
                {formatCurrency(highlightedMonth.conversionsValue)}
              </div>
              <div className="text-xs text-slate-400">{getMonthName(highlightedMonth.monthStart)}</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-xl font-bold text-white">
                {highlightedMonth.roas > 0 ? `${highlightedMonth.roas.toFixed(1)}x` : "-"}
              </div>
              <div className="text-xs text-slate-400">vs avg</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-xl font-bold text-slate-300">
                {formatCurrency(avgValue)}
              </div>
              <div className="text-xs text-slate-400">avg</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <motion.div
        className="flex justify-center gap-4 mt-3 text-xs text-slate-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>Best ROAS</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Most Clicks</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-slate-600" />
          <span>Other Months</span>
        </div>
      </motion.div>
    </div>
  );
}
