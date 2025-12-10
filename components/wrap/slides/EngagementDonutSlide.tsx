"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface EngagementItem {
  name: string;
  value: number;
  color: string;
}

interface EngagementPayload {
  items: EngagementItem[];
  totalEngagement: number;
  engagementRate: number;
}

export function EngagementDonutSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as EngagementPayload;
  const { items, totalEngagement, engagementRate } = payload;

  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  // Calculate segments for the donut
  const segments = items.map((item) => {
    const percent = (item.value / total) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return { ...item, percent, startPercent, endPercent: cumulativePercent };
  });

  // Build conic-gradient string for the donut
  const gradientStops = segments.flatMap((seg) => [
    `${seg.color} ${seg.startPercent}%`,
    `${seg.color} ${seg.endPercent}%`,
  ]);
  const conicGradient = `conic-gradient(from 0deg, ${gradientStops.join(", ")})`;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-12">
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.4),transparent_60%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 flex items-center gap-12">
        {/* Donut Chart using conic-gradient */}
        <motion.div
          className="relative w-48 h-48"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Outer ring with gradient */}
          <motion.div
            className="w-full h-full rounded-full"
            style={{ background: conicGradient }}
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: -90, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
          />
          
          {/* Inner circle to create donut hole */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-slate-900" />
          </div>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              className="text-3xl font-bold text-white"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              {engagementRate.toFixed(1)}%
            </motion.div>
            <motion.div
              className="text-xs text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              engagement
            </motion.div>
          </div>
        </motion.div>

        {/* Legend and stats */}
        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl font-semibold text-white">{slide.title}</h2>
            {slide.subtitle && (
              <p className="text-sm text-slate-400 mt-1">{slide.subtitle}</p>
            )}
          </motion.div>

          <motion.div
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {totalEngagement.toLocaleString()}
            <span className="text-sm font-normal text-slate-400 ml-2">total interactions</span>
          </motion.div>

          <div className="space-y-2">
            {segments.map((seg, i) => (
              <motion.div
                key={seg.name}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <div className="flex-1 text-sm text-slate-300">{seg.name}</div>
                <div className="text-sm font-semibold text-white">
                  {seg.value.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 w-12 text-right">
                  {seg.percent.toFixed(0)}%
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
