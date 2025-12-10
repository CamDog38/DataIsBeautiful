"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface ImpressionsPayload {
  impressions: number;
  reach: number;
  postsPublished: number;
  avgImpressionsPerPost: number;
}

export function ImpressionsReachSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as ImpressionsPayload;
  const { impressions, reach, postsPublished, avgImpressionsPerPost } = payload;

  // Format large numbers
  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-12">
      {/* Animated background waves */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-x-0 h-40 opacity-20"
            style={{
              background: `linear-gradient(180deg, transparent, ${
                ["rgba(59,130,246,0.3)", "rgba(168,85,247,0.3)", "rgba(236,72,153,0.3)"][i]
              }, transparent)`,
              top: `${30 + i * 15}%`,
            }}
            animate={{
              y: [0, -20, 0],
              scaleY: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </motion.div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-xl">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-xl font-medium text-slate-300">{slide.title}</h2>
        </motion.div>

        {/* Main stats */}
        <div className="flex items-center justify-center gap-8 w-full">
          {/* Impressions */}
          <motion.div
            className="flex-1 text-center"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              {formatNumber(impressions)}
            </motion.div>
            <div className="text-sm text-slate-400 mt-2">Impressions</div>
            <div className="text-xs text-slate-600">Times your content was displayed</div>
          </motion.div>

          {/* Divider */}
          <motion.div
            className="h-20 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.5 }}
          />

          {/* Reach */}
          <motion.div
            className="flex-1 text-center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              {formatNumber(reach)}
            </motion.div>
            <div className="text-sm text-slate-400 mt-2">Unique Reach</div>
            <div className="text-xs text-slate-600">Unique accounts reached</div>
          </motion.div>
        </div>

        {/* Secondary stats */}
        <motion.div
          className="flex items-center justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="text-lg font-bold text-white">{postsPublished}</div>
            <div className="text-xs text-slate-500">Posts Published</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="text-lg font-bold text-emerald-400">{formatNumber(avgImpressionsPerPost)}</div>
            <div className="text-xs text-slate-500">Avg per Post</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="text-lg font-bold text-amber-400">
              {reach > 0 ? (impressions / reach).toFixed(1) : "—"}x
            </div>
            <div className="text-xs text-slate-500">Frequency</div>
          </div>
        </motion.div>

        {slide.subtitle && (
          <motion.p
            className="text-sm text-slate-200/80 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {slide.subtitle}
          </motion.p>
        )}
      </div>
    </div>
  );
}
