"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface DayRow {
  dayOfWeek: string;
  results: number;
}

interface MetaAdsBestDayPayload {
  days: DayRow[];
}

export function MetaAdsBestDaySlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as MetaAdsBestDayPayload;
  const days = payload.days || [];

  const winner = days[0];

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-8">
      <motion.div
        className="absolute top-4 right-4 flex items-center gap-2 text-xs text-slate-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[10px] font-bold">f</span>
        <span className="ml-1 font-medium">Meta Ads</span>
      </motion.div>

      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.35),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.3),transparent_50%)] opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <motion.div
          className="text-xs uppercase tracking-[0.2em] text-slate-200/60"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {slide.title}
        </motion.div>

        {slide.subtitle && (
          <motion.p
            className="mt-1 text-sm text-slate-100/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            {slide.subtitle}
          </motion.p>
        )}

        {winner && (
          <motion.div
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-500/20 to-transparent border border-emerald-500/30 px-4 py-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">🏆 Winner: {winner.dayOfWeek}</div>
              <div className="text-sm font-bold text-emerald-400">{formatNumber(winner.results)} results</div>
            </div>
          </motion.div>
        )}

        <motion.div
          className="mt-5 w-full space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {days.slice(0, 5).map((d, index) => {
            const isWinner = index === 0;
            return (
              <motion.div
                key={d.dayOfWeek || index}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 backdrop-blur-sm border ${
                  isWinner ? "bg-emerald-500/10 border-emerald-500/30" : "bg-black/30 border-white/10"
                }`}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${isWinner ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-50"}`}>
                    #{index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-50">{d.dayOfWeek}</div>
                    <div className="text-[11px] text-slate-300/80">{d.results.toLocaleString()}</div>
                  </div>
                </div>
                {isWinner && (
                  <div className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Best Day</div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
