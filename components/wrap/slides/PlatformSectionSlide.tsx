"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface PlatformSectionPayload {
  platform: "google" | "meta" | "linkedin" | string;
}

export function PlatformSectionSlide({ slide }: { slide: Slide }) {
  const payload = (slide.payload || {}) as PlatformSectionPayload;
  const platform = (payload.platform || "").toLowerCase();

  const getLabel = () => {
    if (platform.includes("google")) return "Google Ads";
    if (platform.includes("meta") || platform.includes("facebook")) return "Meta Ads";
    if (platform.includes("linkedin")) return "LinkedIn Ads";
    return "Ads Platform";
  };

  const getBadge = () => {
    if (platform.includes("google")) {
      return (
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="text-blue-500">●</span>
          <span className="text-red-500">●</span>
          <span className="text-yellow-500">●</span>
          <span className="text-green-500">●</span>
          <span className="ml-1 font-medium">Google Ads</span>
        </div>
      );
    }
    if (platform.includes("meta") || platform.includes("facebook")) {
      return (
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[10px] font-bold">f</span>
          <span className="ml-1 font-medium">Meta Ads</span>
        </div>
      );
    }
    if (platform.includes("linkedin")) {
      return (
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold">in</span>
          <span className="ml-1 font-medium">LinkedIn Ads</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center px-8 py-6">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.35),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.35),transparent_55%)] opacity-70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 0.8 }}
      />

      <motion.div
        className="relative z-10 max-w-2xl text-center px-8 py-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="mb-3 flex justify-center">{getBadge()}</div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          {slide.title || `${getLabel()} Spotlight`}
        </h2>
        {slide.subtitle && (
          <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto">
            {slide.subtitle}
          </p>
        )}
      </motion.div>
    </div>
  );
}
