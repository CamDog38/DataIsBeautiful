"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

type Props = {
  slide: Slide;
  slides: Slide[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onViewDashboard: () => void;
};

export function WrapDashboardSlide({ slide, slides, currentIndex, onSelectIndex, onViewDashboard }: Props) {
  const cards = slides
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.type !== "wrapDashboard");

  return (
    <div className="relative flex h-full w-full flex-col px-8 py-6">
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_100%_0%,rgba(129,140,248,0.45),transparent_55%),radial-gradient(circle_at_0%_100%,rgba(45,212,191,0.45),transparent_55%)]"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{slide.title}</h2>
            {slide.subtitle && <p className="text-xs text-slate-300 mt-1">{slide.subtitle}</p>}
          </div>
          <button
            onClick={onViewDashboard}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-[0_12px_40px_rgba(168,85,247,0.25)] hover:from-purple-600 hover:to-pink-600 transition text-sm border border-white/10"
          >
            View dashboard
          </button>
        </div>
      </motion.div>

      <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 overflow-auto pb-2">
        {cards.map(({ s, i }, idx) => (
          <motion.button
            key={s.id}
            onClick={() => onSelectIndex(i)}
            className={`text-left rounded-2xl border px-4 py-3 transition shadow-sm ${
              i === currentIndex
                ? "border-emerald-400/50 bg-emerald-400/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.03 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400">Slide {idx + 1}</div>
                <div className="mt-1 text-sm font-semibold text-white line-clamp-2">{s.title}</div>
                {s.subtitle && (
                  <div className="mt-1 text-[11px] text-slate-300/70 line-clamp-2">{s.subtitle}</div>
                )}
              </div>
              <div className="shrink-0 rounded-full bg-black/25 border border-white/10 px-2 py-1 text-[10px] text-slate-200/80">
                {s.type}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="relative z-10 mt-4 text-center text-[11px] text-slate-300/70">
        Click any card to jump back into your wrap.
      </div>
    </div>
  );
}
