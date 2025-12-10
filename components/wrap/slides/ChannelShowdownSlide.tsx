"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface ChannelMetrics {
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface ShowdownPayload {
  channelA: ChannelMetrics;
  channelB: ChannelMetrics;
  currency?: string;
}

export function ChannelShowdownSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as ShowdownPayload;
  const { channelA, channelB, currency = "USD" } = payload;

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
    return `${symbol}${n.toLocaleString()}`;
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  const metrics = [
    { 
      label: "Spend", 
      a: formatCurrency(channelA.spend), 
      b: formatCurrency(channelB.spend),
      winnerA: channelA.spend < channelB.spend, // Lower spend = more efficient
    },
    { 
      label: "Impressions", 
      a: formatNumber(channelA.impressions), 
      b: formatNumber(channelB.impressions),
      winnerA: channelA.impressions > channelB.impressions,
    },
    { 
      label: "Clicks", 
      a: formatNumber(channelA.clicks), 
      b: formatNumber(channelB.clicks),
      winnerA: channelA.clicks > channelB.clicks,
    },
    { 
      label: "CTR", 
      a: `${channelA.ctr.toFixed(2)}%`, 
      b: `${channelB.ctr.toFixed(2)}%`,
      winnerA: channelA.ctr > channelB.ctr,
    },
  ];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-10">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.4),transparent_40%),radial-gradient(circle_at_80%_50%,rgba(239,68,68,0.4),transparent_40%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 w-full max-w-2xl">
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

        {/* Channel names header */}
        <motion.div
          className="flex justify-between items-center mb-6 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center flex-1">
            <div className="text-lg font-bold text-blue-400">{channelA.name}</div>
          </div>
          <div className="text-slate-500 text-sm font-medium px-4">VS</div>
          <div className="text-center flex-1">
            <div className="text-lg font-bold text-red-400">{channelB.name}</div>
          </div>
        </motion.div>

        {/* Metrics comparison */}
        <div className="space-y-3">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className="flex items-center justify-between">
                {/* Channel A value */}
                <div className={`flex-1 text-center ${metric.winnerA ? "text-emerald-400" : "text-white"}`}>
                  <span className="text-xl font-bold">{metric.a}</span>
                  {metric.winnerA && <span className="ml-2 text-xs">✓</span>}
                </div>

                {/* Metric label */}
                <div className="px-4">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">{metric.label}</span>
                </div>

                {/* Channel B value */}
                <div className={`flex-1 text-center ${!metric.winnerA ? "text-emerald-400" : "text-white"}`}>
                  <span className="text-xl font-bold">{metric.b}</span>
                  {!metric.winnerA && <span className="ml-2 text-xs">✓</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm text-slate-400">
            Head-to-head comparison of your top channels
          </p>
        </motion.div>
      </div>
    </div>
  );
}
