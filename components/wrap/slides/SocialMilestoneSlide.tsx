"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface MilestonePayload {
  milestone: string;
  currentFollowers: number;
  bestMonth: string;
  platform: string;
}

export function SocialMilestoneSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as MilestonePayload;
  const { milestone, currentFollowers, bestMonth, platform } = payload;

  // Parse milestone number (e.g., "100K followers" -> 100000)
  const milestoneMatch = milestone?.match(/(\d+(?:\.\d+)?)\s*([KkMm])?/);
  let milestoneNum = 0;
  if (milestoneMatch) {
    milestoneNum = parseFloat(milestoneMatch[1]);
    const suffix = milestoneMatch[2]?.toUpperCase();
    if (suffix === "K") milestoneNum *= 1000;
    if (suffix === "M") milestoneNum *= 1000000;
  }

  const progress = milestoneNum > 0 ? Math.min((currentFollowers / milestoneNum) * 100, 100) : 100;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-12 overflow-hidden">
      {/* Celebration background */}
      <motion.div
        className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_30%,rgba(251,191,36,0.5),transparent_50%),radial-gradient(circle_at_50%_70%,rgba(168,85,247,0.4),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1 }}
      />

      {/* Confetti particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-5%`,
          }}
          initial={{ y: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: ["0vh", "110vh"],
            opacity: [0, 1, 1, 0],
            rotate: [0, 360, 720],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            delay: i * 0.15,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          {["🎉", "🎊", "⭐", "✨", "🏆", "💫"][i % 6]}
        </motion.div>
      ))}

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md">
        {/* Trophy icon */}
        <motion.div
          className="text-7xl"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          🏆
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-2xl font-bold text-white text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {slide.title}
        </motion.h2>

        {/* Milestone badge */}
        <motion.div
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500/30 to-yellow-500/30 border border-amber-400/50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200 text-center">
            {milestone || `${currentFollowers.toLocaleString()} followers`}
          </div>
        </motion.div>

        {/* Progress bar to milestone */}
        {milestoneNum > 0 && (
          <motion.div
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>0</span>
              <span>{milestone}</span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="text-center text-sm text-amber-400 mt-2 font-semibold">
              {progress >= 100 ? "Goal Achieved! 🎯" : `${progress.toFixed(0)}% complete`}
            </div>
          </motion.div>
        )}

        {/* Best month callout */}
        {bestMonth && (
          <motion.div
            className="flex items-center gap-2 text-sm text-slate-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span className="text-lg">📅</span>
            <span>Best growth month: <span className="text-emerald-400 font-semibold">{bestMonth}</span></span>
          </motion.div>
        )}

        {slide.subtitle && (
          <motion.p
            className="text-sm text-slate-400 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            {slide.subtitle}
          </motion.p>
        )}
      </div>
    </div>
  );
}
