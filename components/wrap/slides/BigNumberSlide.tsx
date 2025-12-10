"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

export function BigNumberSlide({ slide }: { slide: Slide }) {
  const value = slide.payload?.value as number | undefined;
  const label = slide.payload?.label as string | undefined;
  const format = slide.payload?.format as string | undefined;
  const growth = slide.payload?.growth as string | undefined;

  // Format the big number
  const formatValue = (val: number | undefined): string => {
    if (val === undefined || val === null) return "—";
    if (format === "percent") {
      return `${val.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
    }
    if (format === "currency") {
      return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    // Default: number with commas
    return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-16">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(56,189,248,0.4),transparent_55%),radial-gradient(circle_at_100%_0%,rgba(129,140,248,0.5),transparent_55%)] opacity-40"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        {/* Category label */}
        {label && (
          <motion.div
            className="text-xs uppercase tracking-[0.24em] text-slate-200/70"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {label}
          </motion.div>
        )}

        {/* Title */}
        <motion.div
          className="text-lg font-medium uppercase tracking-[0.15em] text-slate-300/90"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {slide.title}
        </motion.div>

        {/* Big Number */}
        {value !== undefined && (
          <motion.div
            className="text-7xl font-bold tracking-tight text-white drop-shadow-[0_10px_40px_rgba(0,0,0,0.7)]"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.8, 0.25, 1], delay: 0.2 }}
          >
            {formatValue(value)}
          </motion.div>
        )}

        {/* Growth indicator */}
        {growth && (
          <motion.div
            className={`text-lg font-semibold ${
              parseFloat(growth) >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {parseFloat(growth) >= 0 ? "+" : ""}
            {growth}% growth
          </motion.div>
        )}

        {/* Subtitle */}
        {slide.subtitle && (
          <motion.p
            className="max-w-md text-sm text-slate-200/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {slide.subtitle}
          </motion.p>
        )}
      </div>
    </div>
  );
}
