"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface HourlyData {
  dayOfWeek: number | string;
  hour: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  spend: number;
}

interface DayHourHeatmapPayload {
  data: HourlyData[];
  metric?: "conversions" | "clicks" | "spend" | "impressions";
  currency?: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayHourHeatmapSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as DayHourHeatmapPayload;
  const { data = [], metric = "conversions", currency = "USD" } = payload;

  if (typeof window !== "undefined") {
    // Debug: verify we receive data from API in dev
    console.log("[DayHourHeatmapSlide] data length:", data.length, "sample:", data[0]);
  }

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", AED: "د.إ", ZAR: "R", AUD: "A$", CAD: "C$",
    };
    return symbols[code] || "$";
  };

  const symbol = getCurrencySymbol(currency);

  const getDayIndex = (value: number | string): number => {
    if (typeof value === "number") {
      const idx = value % 7;
      return idx < 0 ? idx + 7 : idx;
    }
    const name = value.toString().toUpperCase();
    const map: Record<string, number> = {
      MONDAY: 0,
      TUESDAY: 1,
      WEDNESDAY: 2,
      THURSDAY: 3,
      FRIDAY: 4,
      SATURDAY: 5,
      SUNDAY: 6,
    };
    return map[name] ?? 0;
  };

  // Build a 7x24 grid
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  data.forEach((d) => {
    // dayOfWeek can be a numeric index or a day name like "MONDAY"
    const dayIndex = getDayIndex(d.dayOfWeek);
    const hourIndex = d.hour;
    if (dayIndex >= 0 && dayIndex < 7 && hourIndex >= 0 && hourIndex < 24) {
      grid[dayIndex][hourIndex] = d[metric] || 0;
    }
  });

  // Find max for color scaling
  const allValues = grid.flat();
  const maxVal = Math.max(...allValues, 1);

  const getColor = (value: number) => {
    const intensity = value / maxVal;
    if (intensity === 0) return "bg-slate-800/50";
    if (intensity < 0.25) return "bg-blue-900/70";
    if (intensity < 0.5) return "bg-blue-700/80";
    if (intensity < 0.75) return "bg-purple-600/90";
    return "bg-pink-500";
  };

  // Find best time slot
  let bestDay = 0;
  let bestHour = 0;
  let bestValue = 0;
  grid.forEach((row, dayIdx) => {
    row.forEach((val, hourIdx) => {
      if (val > bestValue) {
        bestValue = val;
        bestDay = dayIdx;
        bestHour = hourIdx;
      }
    });
  });

  const formatHour = (h: number) => {
    if (h === 0) return "12am";
    if (h < 12) return `${h}am`;
    if (h === 12) return "12pm";
    return `${h - 12}pm`;
  };

  const formatMetricValue = (val: number) => {
    if (metric === "spend") {
      return val >= 1000 ? `${symbol}${(val / 1000).toFixed(1)}K` : `${symbol}${val.toFixed(0)}`;
    }
    return val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val.toFixed(0);
  };

  return (
    <div className="relative flex h-full w-full flex-col px-6 py-4">
      {/* Google Ads branding */}
      <motion.div
        className="absolute top-4 right-4 flex items-center gap-2 text-xs text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-blue-500">●</span>
        <span className="text-red-500">●</span>
        <span className="text-yellow-500">●</span>
        <span className="text-green-500">●</span>
        <span className="ml-1 font-medium">Google Ads</span>
      </motion.div>

      {/* Title */}
      <motion.div
        className="text-center mb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-bold text-white">{slide.title}</h2>
        {slide.subtitle && (
          <p className="text-xs text-slate-400 mt-1">{slide.subtitle}</p>
        )}
      </motion.div>

      {/* Heatmap Grid */}
      <motion.div
        className="flex-1 flex flex-col justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Hour labels */}
        <div className="flex ml-10 mb-1">
          {HOURS.filter((h) => h % 3 === 0).map((h) => (
            <div
              key={h}
              className="text-[10px] text-slate-500"
              style={{ width: `${100 / 8}%` }}
            >
              {formatHour(h)}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        <div className="flex flex-col gap-1">
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-1">
              <div className="w-8 text-xs text-slate-400 text-right pr-2">{day}</div>
              <div className="flex-1 flex gap-[2px]">
                {HOURS.map((hour) => {
                  const value = grid[dayIdx][hour];
                  return (
                    <motion.div
                      key={`${dayIdx}-${hour}`}
                      className={`flex-1 h-5 rounded-sm ${getColor(value)} transition-colors`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + (dayIdx * 24 + hour) * 0.002 }}
                      title={`${day} ${formatHour(hour)}: ${formatMetricValue(value)} ${metric}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400">
          <span>Low</span>
          <div className="flex gap-[2px]">
            <div className="w-4 h-3 rounded-sm bg-slate-800/50" />
            <div className="w-4 h-3 rounded-sm bg-blue-900/70" />
            <div className="w-4 h-3 rounded-sm bg-blue-700/80" />
            <div className="w-4 h-3 rounded-sm bg-purple-600/90" />
            <div className="w-4 h-3 rounded-sm bg-pink-500" />
          </div>
          <span>High</span>
        </div>
      </motion.div>

      {/* Best time callout */}
      <motion.div
        className="text-center mt-2 py-2 px-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <span className="text-slate-300 text-sm">Peak performance: </span>
        <span className="text-white font-bold">
          {DAYS[bestDay]} at {formatHour(bestHour)}
        </span>
        <span className="text-emerald-400 font-bold ml-2">
          {formatMetricValue(bestValue)} {metric}
        </span>
      </motion.div>
    </div>
  );
}
