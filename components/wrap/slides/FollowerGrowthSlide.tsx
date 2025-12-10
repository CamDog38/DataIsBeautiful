"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface FollowerGrowthPayload {
  startFollowers: number;
  endFollowers: number;
  netGain: number;
  growthPercent: number;
  monthlyData?: { month: string; followers: number }[];
}

export function FollowerGrowthSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as FollowerGrowthPayload;
  const { startFollowers, endFollowers, netGain, growthPercent, monthlyData } = payload;

  // Generate mock monthly data if not provided
  const chartData = monthlyData || generateMockData(startFollowers, endFollowers);
  const maxFollowers = Math.max(...chartData.map((d) => d.followers));
  const minFollowers = Math.min(...chartData.map((d) => d.followers));
  const range = maxFollowers - minFollowers || 1;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-12">
      {/* Gradient background */}
      <motion.div
        className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_30%_70%,rgba(168,85,247,0.5),transparent_50%),radial-gradient(circle_at_70%_30%,rgba(236,72,153,0.4),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1 }}
      />

      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: ["#a855f7", "#ec4899", "#8b5cf6", "#f472b6"][i % 4],
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0], y: [0, -20, -40] }}
          transition={{ duration: 3, delay: i * 0.2, repeat: Infinity, repeatDelay: 2 }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-xl font-medium text-slate-300 text-center">{slide.title}</h2>
        </motion.div>

        {/* Big number */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
        >
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]">
            +{netGain.toLocaleString()}
          </div>
          <div className="text-slate-400 text-sm mt-1">new followers</div>
        </motion.div>

        {/* Growth chart */}
        <motion.div
          className="w-full h-32 flex items-end gap-1 px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {chartData.map((d, i) => {
            const height = ((d.followers - minFollowers) / range) * 100;
            return (
              <motion.div
                key={d.month}
                className="flex-1 flex flex-col items-center gap-1"
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ delay: 0.6 + i * 0.05 }}
              >
                <motion.div
                  className="w-full rounded-t-md bg-gradient-to-t from-purple-500/60 to-pink-500/80"
                  style={{ height: `${Math.max(height, 10)}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.7 + i * 0.05, duration: 0.4 }}
                />
                <span className="text-[9px] text-slate-500">{d.month}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Stats row */}
        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{startFollowers.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Start of year</div>
          </div>
          <div className="text-3xl text-pink-400">→</div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{endFollowers.toLocaleString()}</div>
            <div className="text-xs text-slate-500">End of year</div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
            <span className="text-emerald-400 font-bold">↑ {growthPercent.toFixed(1)}%</span>
          </div>
        </motion.div>

        {slide.subtitle && (
          <motion.p
            className="text-sm text-slate-200/80 text-center"
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

function generateMockData(start: number, end: number) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const diff = end - start;
  return months.map((month, i) => ({
    month,
    followers: Math.round(start + (diff * (i + 1)) / 12 + (Math.random() - 0.5) * diff * 0.1),
  }));
}
