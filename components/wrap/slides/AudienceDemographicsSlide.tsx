"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface AudiencePayload {
  topCountry: string;
  topCity: string;
  topAgeRange: string;
  genderSplit: string;
  peakHours: string;
  interests?: string;
}

export function AudienceDemographicsSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as AudiencePayload;
  const { topCountry, topCity, topAgeRange, genderSplit, peakHours, interests } = payload;

  // Parse gender split (e.g., "60% Female, 40% Male")
  const genderParts = genderSplit.match(/(\d+)%?\s*(female|women|f)/i);
  const femalePercent = genderParts ? parseInt(genderParts[1]) : 50;
  const malePercent = 100 - femalePercent;

  const stats = [
    { icon: "🌍", label: "Top Country", value: topCountry, color: "from-blue-400 to-cyan-400" },
    { icon: "🏙️", label: "Top City", value: topCity, color: "from-purple-400 to-pink-400" },
    { icon: "👥", label: "Age Range", value: topAgeRange, color: "from-orange-400 to-amber-400" },
    { icon: "⏰", label: "Peak Hours", value: peakHours, color: "from-emerald-400 to-teal-400" },
  ];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-10">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_0%_100%,rgba(59,130,246,0.4),transparent_50%),radial-gradient(circle_at_100%_0%,rgba(168,85,247,0.4),transparent_50%)]"
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

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</div>
                  <div className={`text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
                    {stat.value || "—"}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gender split bar */}
        <motion.div
          className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Gender Split</div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 rounded-full bg-white/10 overflow-hidden flex">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${femalePercent}%` }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${malePercent}%` }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                />
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-pink-400">♀ {femalePercent}%</span>
              <span className="text-blue-400">♂ {malePercent}%</span>
            </div>
          </div>
        </motion.div>

        {/* Interests */}
        {interests && (
          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Top Interests</div>
            <div className="flex flex-wrap justify-center gap-2">
              {interests.split(",").slice(0, 5).map((interest, i) => (
                <motion.span
                  key={i}
                  className="px-3 py-1 rounded-full bg-white/10 text-xs text-slate-300"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + i * 0.05 }}
                >
                  {interest.trim()}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
