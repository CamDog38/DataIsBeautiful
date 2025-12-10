"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface Milestone {
  icon: string;
  text: string;
  month?: string;
}

interface MilestonesPayload {
  milestones: Milestone[];
  currency?: string;
}

export function MilestonesSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as MilestonesPayload;
  const { milestones } = payload;

  const colors = [
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-500",
    "from-blue-400 to-cyan-500",
    "from-purple-400 to-pink-500",
    "from-rose-400 to-red-500",
  ];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-10">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.3),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.3),transparent_40%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
      />

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

        {/* Milestones timeline */}
        <div className="space-y-4">
          {milestones.slice(0, 5).map((milestone, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
            >
              {/* Icon circle */}
              <motion.div
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-xl shrink-0`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
              >
                {milestone.icon}
              </motion.div>

              {/* Text */}
              <div className="flex-1 pt-2">
                <p className="text-white text-sm leading-relaxed">
                  {milestone.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Decorative line connecting milestones */}
        <motion.div
          className="absolute left-[calc(50%-12rem)] top-32 bottom-20 w-px bg-gradient-to-b from-amber-500/50 via-purple-500/50 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{ transformOrigin: "top" }}
        />
      </div>
    </div>
  );
}
