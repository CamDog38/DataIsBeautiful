"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface ContentPayload {
  bestFormat: string;
  bestFormatReach: number;
  topHashtag: string;
  bestDay: string;
  viralReach: number;
}

export function ContentPerformanceSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as ContentPayload;
  const { bestFormat, bestFormatReach, topHashtag, bestDay, viralReach } = payload;

  const getFormatIcon = (format: string) => {
    const lower = format.toLowerCase();
    if (lower.includes("reel") || lower.includes("video")) return "🎬";
    if (lower.includes("carousel")) return "📸";
    if (lower.includes("story") || lower.includes("stories")) return "📖";
    if (lower.includes("live")) return "🔴";
    if (lower.includes("post") || lower.includes("image")) return "🖼️";
    return "✨";
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-10">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.4),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.3),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
      />

      {/* Sparkles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-xl"
          style={{
            left: `${15 + Math.random() * 70}%`,
            top: `${15 + Math.random() * 70}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 2, delay: i * 0.2, repeat: Infinity, repeatDelay: 3 }}
        >
          ✨
        </motion.div>
      ))}

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

        {/* Best Format - Hero card */}
        <motion.div
          className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-3xl p-6 mb-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="text-5xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              {getFormatIcon(bestFormat)}
            </motion.div>
            <div className="flex-1">
              <div className="text-xs text-amber-400/80 uppercase tracking-wider">Best Performing Format</div>
              <div className="text-2xl font-bold text-white">{bestFormat}</div>
              <div className="text-sm text-slate-400">
                {formatNumber(bestFormatReach)} reach on average
              </div>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        </motion.div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 gap-3">
          {/* Top Hashtag */}
          <motion.div
            className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-2xl mb-1">#️⃣</div>
            <div className="text-xs text-slate-500 uppercase">Top Hashtag</div>
            <div className="text-sm font-bold text-purple-400 truncate">
              #{topHashtag?.replace("#", "") || "—"}
            </div>
          </motion.div>

          {/* Best Day */}
          <motion.div
            className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-2xl mb-1">📅</div>
            <div className="text-xs text-slate-500 uppercase">Best Day</div>
            <div className="text-sm font-bold text-emerald-400">{bestDay || "—"}</div>
          </motion.div>

          {/* Viral Reach */}
          <motion.div
            className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-2xl mb-1">🚀</div>
            <div className="text-xs text-slate-500 uppercase">Viral Reach</div>
            <div className="text-sm font-bold text-pink-400">{formatNumber(viralReach)}</div>
          </motion.div>
        </div>

        {/* Insight */}
        <motion.div
          className="mt-6 text-center text-sm text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <span className="text-amber-400 font-semibold">{bestFormat}</span> content performed best for your audience
        </motion.div>
      </div>
    </div>
  );
}
