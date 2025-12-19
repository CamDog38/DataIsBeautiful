"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface Campaign {
  campaignId: string;
  campaignName: string;
  clicks: number;
}

interface MetaAdsCampaignsClicksPayload {
  campaigns: Campaign[];
}

export function MetaAdsCampaignsClicksSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as MetaAdsCampaignsClicksPayload;
  const { campaigns = [] } = payload;

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toFixed(0);
  };

  const topCampaigns = campaigns.slice(0, 5);
  const best = topCampaigns[0];

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
          const isBest = campaign === best;
          return (
            <motion.div
              key={campaign.campaignId || index}
              className={`flex items-center gap-4 p-3 rounded-xl ${
                isBest ? "bg-gradient-to-r from-blue-500/20 to-transparent border border-blue-500/30" : "bg-white/5 border border-white/10"
              }`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isBest ? "bg-blue-500 text-white" : "bg-white/10 text-slate-400"}`}>
                #{index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{campaign.campaignName}</span>
                  {isBest && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">🏁 Most Clicks</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-white">{formatNumber(campaign.clicks)} <span className="text-xs text-slate-400">clicks</span></div>
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
          <div className="text-lg font-bold text-blue-300">{formatNumber(campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0))}</div>
          <div>Total Clicks</div>
        </div>
      </motion.div>
    </div>
  );
}
