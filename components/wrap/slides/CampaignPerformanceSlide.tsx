"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface Campaign {
  name: string;
  spend: number;
  results: number;
  impressions: number;
  cpr: number;
  primaryResultTypeName?: string;
  isTopPerformer?: boolean;
  isMostEfficient?: boolean;
}

interface CampaignPayload {
  campaigns: Campaign[];
  totalSpend: number;
  totalResults: number;
  totalImpressions: number;
  currency?: string; // ISO code like USD, ZAR
}

export function CampaignPerformanceSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as CampaignPayload;
  const { campaigns, totalSpend, totalResults, totalImpressions, currency = "USD" } = payload;

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

  const maxResults = Math.max(...campaigns.map((c) => c.results || 0), 1);

  return (
    <div className="relative flex h-full w-full flex-col px-10 py-8">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_20%,rgba(251,191,36,0.4),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.3),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
          {slide.subtitle && (
            <p className="text-sm text-slate-400 mt-1">{slide.subtitle}</p>
          )}
        </motion.div>

        {/* Campaign cards */}
        <div className="flex-1 flex flex-col justify-center gap-3">
          {campaigns.slice(0, 4).map((campaign, i) => {
            const resultWidth = (campaign.results / maxResults) * 100;

            return (
              <motion.div
                key={`${campaign.name}-${i}`}
                className={`relative bg-black/30 backdrop-blur-sm border rounded-2xl p-4 overflow-hidden ${
                  campaign.isTopPerformer
                    ? "border-amber-500/50"
                    : campaign.isMostEfficient
                    ? "border-emerald-500/50"
                    : "border-white/10"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                {/* Results bar background */}
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500/20 to-transparent"
                  initial={{ width: 0 }}
                  animate={{ width: `${resultWidth}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      campaign.isTopPerformer
                        ? "bg-amber-500/30 text-amber-400"
                        : campaign.isMostEfficient
                        ? "bg-emerald-500/30 text-emerald-400"
                        : "bg-white/10 text-white"
                    }`}>
                      #{i + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{campaign.name}</span>
                        {campaign.isTopPerformer && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400">
                            🏆 Top Results
                          </span>
                        )}
                        {campaign.isMostEfficient && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-400">
                            ⚡ Best CPR
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex gap-3 flex-wrap">
                        <span>{formatCurrency(campaign.spend)} spend</span>
                        {campaign.primaryResultTypeName && (
                          <span className="text-slate-400">
                            • {campaign.primaryResultTypeName}
                          </span>
                        )}
                        {campaign.impressions > 0 && (
                          <span className="text-slate-400">
                            • {formatNumber(campaign.impressions)} impressions
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{formatNumber(campaign.results)} results</div>
                    <div className="text-sm text-emerald-400 font-semibold">{symbol}{campaign.cpr.toFixed(2)} CPR</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <motion.div
          className="flex justify-center gap-8 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase">Total Spend</div>
            <div className="text-lg font-bold text-red-400">{formatCurrency(totalSpend)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase">Total Results</div>
            <div className="text-lg font-bold text-emerald-400">{formatNumber(totalResults)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase">Total Impressions</div>
            <div className="text-lg font-bold text-sky-400">{formatNumber(totalImpressions)}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
