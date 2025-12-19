"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface Campaign {
  campaignId: string;
  campaignName: string;
  results: number;
  spend: number;
  impressions?: number;
  cpr: number | null;
}

interface MetaAdsCampaignsResultsPayload {
  campaigns: Campaign[];
  currency?: string;
}

export function MetaAdsCampaignsResultsSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as MetaAdsCampaignsResultsPayload;
  const { campaigns = [], currency = "USD" } = payload;

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

  const topCampaigns = campaigns.slice(0, 5);
  const bestByResults = topCampaigns[0];
  const mostEfficient = [...campaigns]
    .filter((c) => (c.cpr ?? 0) > 0)
    .sort((a, b) => (a.cpr ?? Number.POSITIVE_INFINITY) - (b.cpr ?? Number.POSITIVE_INFINITY))[0];

  return (
    <div className="relative flex h-full w-full flex-col px-8 py-6">
      <motion.div
        className="absolute top-4 right-4 flex items-center gap-2 text-xs text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[10px] font-bold">f</span>
        <span className="ml-1 font-medium">Meta Ads</span>
      </motion.div>

      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
        {slide.subtitle && <p className="text-sm text-slate-400 mt-1">{slide.subtitle}</p>}
      </motion.div>

      <div className="flex-1 flex flex-col gap-3">
        {topCampaigns.map((campaign, index) => {
          const isBest = campaign === bestByResults;
          const isEfficient = mostEfficient ? campaign.campaignId === mostEfficient.campaignId : false;
          const cpr = campaign.cpr === null || typeof campaign.cpr === "undefined" ? 0 : Number(campaign.cpr) || 0;

          return (
            <motion.div
              key={campaign.campaignId || index}
              className={`flex items-center gap-4 p-3 rounded-xl ${
                isBest
                  ? "bg-gradient-to-r from-emerald-500/20 to-transparent border border-emerald-500/30"
                  : isEfficient
                    ? "bg-gradient-to-r from-amber-500/20 to-transparent border border-amber-500/30"
                    : "bg-white/5 border border-white/10"
              }`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isBest ? "bg-emerald-500 text-white" : isEfficient ? "bg-amber-500 text-white" : "bg-white/10 text-slate-400"
                }`}
              >
                #{index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{campaign.campaignName}</span>
                  {isBest && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">🏆 Top Results</span>
                  )}
                  {isEfficient && !isBest && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">⚡ Best CPR</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{formatCurrency(campaign.spend)} spend</div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {formatNumber(campaign.results)} <span className="text-xs text-slate-400">results</span>
                </div>
                <div className="text-xs text-emerald-400">{formatCurrency(cpr || (campaign.results > 0 ? campaign.spend / campaign.results : 0))} CPR</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="flex justify-center gap-8 mt-4 text-xs text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <div className="text-center">
          <div className="text-lg font-bold text-white">{campaigns.length}</div>
          <div>Campaigns</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-400">{formatNumber(campaigns.reduce((sum, c) => sum + (c.results || 0), 0))}</div>
          <div>Total Results</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">{formatCurrency(campaigns.reduce((sum, c) => sum + (c.spend || 0), 0))}</div>
          <div>Total Spend</div>
        </div>
      </motion.div>
    </div>
  );
}
