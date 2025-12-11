"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface Channel {
  name: string;
  spend: number;
  revenue: number;
  roas: number;
  conversions?: number;
  color: string;
}

interface ChannelPayload {
  channels: Channel[];
  metric: "spend" | "roas" | "revenue" | "conversions";
  currency?: string;
}

const CHANNEL_ICONS: Record<string, string> = {
  meta: "📘",
  facebook: "📘",
  instagram: "📸",
  google: "🔍",
  tiktok: "🎵",
  youtube: "▶️",
  linkedin: "💼",
  twitter: "🐦",
  pinterest: "📌",
  snapchat: "👻",
  default: "📊",
};

export function ChannelComparisonSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as ChannelPayload;
  const { channels, metric = "spend", currency = "USD" } = payload;

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      AED: "د.إ",
      ZAR: "R",
      AUD: "A$",
      CAD: "C$",
    };
    return symbols[code] || "$";
  };

  const symbol = getCurrencySymbol(currency);

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(CHANNEL_ICONS)) {
      if (lower.includes(key)) return icon;
    }
    return CHANNEL_ICONS.default;
  };

  const formatValue = (channel: Channel) => {
    switch (metric) {
      case "spend":
        return { value: channel.spend, formatted: `${symbol}${(channel.spend / 1000).toFixed(0)}K`, label: "spend" };
      case "revenue":
        return { value: channel.revenue, formatted: `${symbol}${(channel.revenue / 1000).toFixed(0)}K`, label: "revenue" };
      case "roas":
        return { value: channel.roas, formatted: `${channel.roas.toFixed(1)}x`, label: "ROAS" };
      case "conversions":
        return { value: channel.conversions || 0, formatted: (channel.conversions || 0).toLocaleString(), label: "conversions" };
      default:
        return { value: channel.spend, formatted: `${symbol}${channel.spend}`, label: "spend" };
    }
  };

  const maxValue = Math.max(...channels.map((c) => formatValue(c).value));
  const sortedChannels = [...channels].sort((a, b) => formatValue(b).value - formatValue(a).value);

  return (
    <div className="relative flex h-full w-full flex-col px-10 py-8">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.4),transparent_50%),radial-gradient(circle_at_80%_50%,rgba(168,85,247,0.3),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
          {slide.subtitle && (
            <p className="text-sm text-slate-400 mt-1">{slide.subtitle}</p>
          )}
        </motion.div>

        {/* Channel bars */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          {sortedChannels.map((channel, i) => {
            const { value, formatted, label } = formatValue(channel);
            const barWidth = (value / maxValue) * 100;

            return (
              <motion.div
                key={channel.name}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                {/* Channel icon & name */}
                <div className="w-32 flex items-center gap-2">
                  <span className="text-2xl">{getIcon(channel.name)}</span>
                  <span className="text-sm font-medium text-white truncate">{channel.name}</span>
                </div>

                {/* Bar */}
                <div className="flex-1 h-10 bg-white/5 rounded-xl overflow-hidden relative">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-xl"
                    style={{ background: `linear-gradient(90deg, ${channel.color}cc, ${channel.color}66)` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                  />
                  <div className="relative h-full flex items-center px-3">
                    <span className="text-sm font-bold text-white">{formatted}</span>
                  </div>
                </div>

                {/* Secondary metrics */}
                <div className="w-24 text-right">
                  {metric !== "roas" && (
                    <div className="text-sm font-bold text-emerald-400">{channel.roas.toFixed(1)}x</div>
                  )}
                  {metric !== "spend" && (
                    <div className="text-xs text-slate-500">{symbol}{(channel.spend / 1000).toFixed(0)}K spent</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <motion.div
          className="text-center text-xs text-slate-500 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Sorted by {metric === "roas" ? "ROAS" : metric} • Best performer:{" "}
          <span className="text-white font-semibold">{sortedChannels[0]?.name}</span>
        </motion.div>
      </div>
    </div>
  );
}
