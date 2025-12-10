"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface Creative {
  description: string;
  performance: string;
  format?: string;
  hook?: string;
}

interface CreativePayload {
  creatives: Creative[];
  bestFormat: string;
  bestHook: string;
  totalTested: number;
  winRate: number;
}

export function CreativeWinsSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as CreativePayload;
  const { creatives, bestFormat, bestHook, totalTested, winRate } = payload;

  const getFormatIcon = (format: string) => {
    const lower = format?.toLowerCase() || "";
    if (lower.includes("video") || lower.includes("reel")) return "🎬";
    if (lower.includes("carousel")) return "📸";
    if (lower.includes("static") || lower.includes("image")) return "🖼️";
    if (lower.includes("story")) return "📖";
    if (lower.includes("ugc")) return "👤";
    return "✨";
  };

  return (
    <div className="relative flex h-full w-full flex-col px-10 py-8">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_30%,rgba(236,72,153,0.4),transparent_50%),radial-gradient(circle_at_50%_70%,rgba(168,85,247,0.3),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
          {slide.subtitle && (
            <p className="text-sm text-slate-400 mt-1">{slide.subtitle}</p>
          )}
        </motion.div>

        {/* Best format hero */}
        <motion.div
          className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl p-5 mb-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="text-5xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {getFormatIcon(bestFormat)}
            </motion.div>
            <div className="flex-1">
              <div className="text-xs text-pink-400/80 uppercase tracking-wider">Best Performing Format</div>
              <div className="text-xl font-bold text-white">{bestFormat || "Video Ads"}</div>
              {bestHook && (
                <div className="text-sm text-slate-400 mt-1">
                  Winning hook: <span className="text-purple-400">"{bestHook}"</span>
                </div>
              )}
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        </motion.div>

        {/* Top creatives */}
        <div className="flex-1 space-y-3">
          {creatives.slice(0, 3).map((creative, i) => (
            <motion.div
              key={i}
              className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{creative.description}</div>
                  <div className="text-xs text-slate-500">{creative.performance}</div>
                </div>
                {creative.format && (
                  <span className="text-xl">{getFormatIcon(creative.format)}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats footer */}
        <motion.div
          className="flex justify-center gap-8 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalTested || 0}</div>
            <div className="text-xs text-slate-500">Creatives Tested</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{winRate || 0}%</div>
            <div className="text-xs text-slate-500">Win Rate</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
