"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface SearchTerm {
  searchTerm: string;
  clicks: number;
  conversions: number;
  conversionValue: number;
  weight: number;
}

interface SearchTermCloudPayload {
  terms: SearchTerm[];
  currency?: string;
}

export function SearchTermCloudSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as SearchTermCloudPayload;
  const { terms = [], currency = "USD" } = payload;

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", AED: "د.إ", ZAR: "R", AUD: "A$", CAD: "C$",
    };
    return symbols[code] || "$";
  };

  const symbol = getCurrencySymbol(currency);

  // Format large numbers with M for millions, K for thousands
  const formatLargeNumber = (n: number) => {
    if (n >= 1000000) return `${symbol}${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${symbol}${(n / 1000).toFixed(0)}K`;
    return `${symbol}${n.toFixed(0)}`;
  };

  // Normalize weights for font sizing
  const maxWeight = Math.max(...terms.map((t) => t.weight), 1);
  const minWeight = Math.min(...terms.map((t) => t.weight), 0);

  const getFontSize = (weight: number) => {
    const normalized = (weight - minWeight) / (maxWeight - minWeight || 1);
    return 12 + normalized * 28; // 12px to 40px
  };

  const getOpacity = (weight: number) => {
    const normalized = (weight - minWeight) / (maxWeight - minWeight || 1);
    return 0.5 + normalized * 0.5;
  };

  // Take top 50 for display
  const displayTerms = terms.slice(0, 50);

  // Color palette for variety
  const colors = [
    "text-blue-400",
    "text-purple-400",
    "text-pink-400",
    "text-emerald-400",
    "text-amber-400",
    "text-cyan-400",
  ];

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
        className="text-center mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
        {slide.subtitle && (
          <p className="text-sm text-slate-400 mt-1">{slide.subtitle}</p>
        )}
      </motion.div>

      {/* Word Cloud */}
      <motion.div
        className="flex-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 overflow-hidden px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {displayTerms.map((term, index) => (
          <motion.span
            key={term.searchTerm}
            className={`${colors[index % colors.length]} font-medium cursor-default transition-transform hover:scale-110`}
            style={{
              fontSize: `${getFontSize(term.weight)}px`,
              opacity: getOpacity(term.weight),
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: getOpacity(term.weight), scale: 1 }}
            transition={{ delay: 0.3 + index * 0.02, duration: 0.3 }}
            title={`${term.conversions.toFixed(0)} conversions • ${symbol}${term.conversionValue.toFixed(0)} value`}
          >
            {term.searchTerm}
          </motion.span>
        ))}
      </motion.div>

      {/* Stats footer */}
      <motion.div
        className="flex justify-center gap-8 mt-4 text-xs text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-center">
          <div className="text-lg font-bold text-white">{terms.length}</div>
          <div>Search Terms</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-400">
            {terms.reduce((sum, t) => sum + t.conversions, 0).toFixed(0)}
          </div>
          <div>Total Conversions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">
            {formatLargeNumber(terms.reduce((sum, t) => sum + t.conversionValue, 0))}
          </div>
          <div>Conversion Value</div>
        </div>
      </motion.div>
    </div>
  );
}
