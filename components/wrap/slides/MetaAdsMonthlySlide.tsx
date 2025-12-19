"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface MonthData {
  monthStart: string;
  spend: number;
  clicks: number;
  results: number;
  highlightLabel: string;
}

interface MetaAdsMonthlyPayload {
  months: MonthData[];
  currency?: string;
  metric?: "results" | "clicks" | "spend";
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MetaAdsMonthlySlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as MetaAdsMonthlyPayload;
  const { months = [], currency = "USD", metric = "results" } = payload;

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

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toFixed(0);
  };

  const getMonthName = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return MONTH_NAMES[date.getMonth()] || "";
  };

  const getValue = (m: MonthData) => {
    switch (metric) {
      case "results":
        return m.results || 0;
      case "clicks":
        return m.clicks || 0;
      case "spend":
        return m.spend || 0;
      default:
        return m.results || 0;
    }
  };

  const maxValue = Math.max(...months.map(getValue), 1);
  const highlightedMonth = months.find((m) => m.highlightLabel === "BEST_RESULTS_MONTH");
  const avgValue = months.length > 0 ? months.reduce((sum, m) => sum + getValue(m), 0) / months.length : 0;

  const avgSpend = months.length > 0 ? months.reduce((sum, m) => sum + (m.spend || 0), 0) / months.length : 0;
  const avgResults = months.length > 0 ? months.reduce((sum, m) => sum + (m.results || 0), 0) / months.length : 0;
  const avgCpr = avgResults > 0 ? avgSpend / avgResults : 0;

  const highlightedSpend = highlightedMonth?.spend || 0;
  const highlightedResults = highlightedMonth?.results || 0;
  const highlightedCpr = highlightedResults > 0 ? highlightedSpend / highlightedResults : 0;

  return (
    <div className="relative flex h-full w-full flex-col px-8 py-6">
      {/* Meta Ads branding */}
      <motion.div
        className="absolute top-4 right-4 flex items-center gap-2 text-xs text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[10px] font-bold">f</span>
        <span className="ml-1 font-medium">Meta Ads</span>
      </motion.div>

      {/* Title */}
      <motion.div
        className="mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-bold text-white">{slide.title}</h2>
        {slide.subtitle && <p className="text-xs text-slate-400 mt-1">{slide.subtitle}</p>}
      </motion.div>

      {/* Bar chart */}
      <div className="flex-1 flex items-end justify-center gap-2 px-4 pb-8">
        {months.map((month, index) => {
          const value = getValue(month);
          const barHeight = (value / maxValue) * 100;
          const isBestResults = month.highlightLabel === "BEST_RESULTS_MONTH";
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
              <motion.div
                className={`w-12 rounded-t-lg ${
                  isBestResults
                    ? "bg-gradient-to-t from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30"
                    : isBestClicks
                      ? "bg-gradient-to-t from-blue-500 to-blue-400"
                      : isMostExpensive
                        ? "bg-gradient-to-t from-amber-500 to-orange-400"
                        : "bg-slate-600/80"
                }`}
                style={{ minHeight: 8 }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(barHeight * 2, 8)}px` }}
                transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
              />
              <span className={`text-xs ${isBestResults ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                {getMonthName(month.monthStart)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Highlight callout */}
      {highlightedMonth && (
        <motion.div
          className="mx-auto px-6 py-3 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 rounded-xl border border-emerald-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <div className="text-xs text-slate-400">{getMonthName(highlightedMonth.monthStart)}</div>
              <div className="mt-1 text-xl font-bold text-emerald-400">
                {metric === "spend" ? formatCurrency(getValue(highlightedMonth)) : formatNumber(getValue(highlightedMonth))}
              </div>
              <div className="text-[10px] text-slate-500">highlight ({metric})</div>
            </div>

            <div className="h-10 w-px bg-white/10" />

            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Spend</div>
                <div className="text-sm font-bold text-white">{formatCurrency(highlightedSpend)}</div>
                <div className="text-[10px] text-slate-500">avg {formatCurrency(avgSpend)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Results</div>
                <div className="text-sm font-bold text-white">{formatNumber(highlightedResults)}</div>
                <div className="text-[10px] text-slate-500">avg {formatNumber(avgResults)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">CPR</div>
                <div className="text-sm font-bold text-white">
                  {highlightedCpr > 0 ? formatCurrency(highlightedCpr) : "-"}
                </div>
                <div className="text-[10px] text-slate-500">
                  avg {avgCpr > 0 ? formatCurrency(avgCpr) : "-"}
                </div>
              </div>
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
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Best Results</span>
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
