"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface DeviceData {
  device: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface DeviceBreakdownPayload {
  devices: DeviceData[];
  metric?: "spend" | "conversions" | "clicks" | "impressions";
  currency?: string;
}

const DEVICE_ICONS: Record<string, string> = {
  MOBILE: "📱",
  DESKTOP: "🖥️",
  TABLET: "📲",
  CONNECTED_TV: "📺",
  OTHER: "🔌",
  UNKNOWN: "❓",
};

const DEVICE_COLORS: Record<string, string> = {
  MOBILE: "#3b82f6",    // blue
  DESKTOP: "#8b5cf6",   // purple
  TABLET: "#ec4899",    // pink
  CONNECTED_TV: "#f59e0b", // amber
  OTHER: "#10b981",     // emerald
  UNKNOWN: "#64748b",   // slate
};

export function DeviceBreakdownSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as DeviceBreakdownPayload;
  const { devices = [], metric = "spend", currency = "USD" } = payload;

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", AED: "د.إ", ZAR: "R", AUD: "A$", CAD: "C$",
    };
    return symbols[code] || "$";
  };

  const symbol = getCurrencySymbol(currency);

  // Calculate totals
  const total = devices.reduce((sum, d) => sum + (d[metric] || 0), 0);

  // Sort by metric value
  const sortedDevices = [...devices].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));

  // Calculate percentages and angles for donut
  let cumulativeAngle = 0;
  const segments = sortedDevices.map((d) => {
    const value = d[metric] || 0;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return {
      ...d,
      value,
      percentage,
      startAngle,
      endAngle: cumulativeAngle,
      color: DEVICE_COLORS[d.device] || DEVICE_COLORS.UNKNOWN,
    };
  });

  const formatValue = (val: number) => {
    if (metric === "spend") {
      return val >= 1000 ? `${symbol}${(val / 1000).toFixed(1)}K` : `${symbol}${val.toFixed(0)}`;
    }
    return val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val.toFixed(0);
  };

  const formatDeviceName = (device: string) => {
    return device.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // SVG donut chart
  const size = 180;
  const strokeWidth = 35;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex h-full w-full flex-col px-8 py-6">
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
        className="text-center mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
        {slide.subtitle && (
          <p className="text-sm text-slate-400 mt-1">{slide.subtitle}</p>
        )}
      </motion.div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center gap-12">
        {/* Donut Chart */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <svg width={size} height={size} className="transform -rotate-90">
            {segments.map((seg, index) => {
              const dashLength = (seg.percentage / 100) * circumference;
              const dashOffset = ((100 - seg.percentage) / 100) * circumference;
              const rotation = (seg.startAngle / 360) * circumference;

              return (
                <motion.circle
                  key={seg.device}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference}`}
                  strokeDashoffset={-rotation}
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${dashLength} ${circumference}` }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                />
              );
            })}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-white">{formatValue(total)}</div>
            <div className="text-xs text-slate-400 capitalize">{metric}</div>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          {segments.map((seg, index) => (
            <motion.div
              key={seg.device}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <div className="flex items-center gap-2">
                <span className="text-lg">{DEVICE_ICONS[seg.device] || "📱"}</span>
                <div>
                  <div className="text-sm font-medium text-white">
                    {formatDeviceName(seg.device)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatValue(seg.value)} ({seg.percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Top device callout */}
      {segments.length > 0 && (
        <motion.div
          className="text-center mt-4 py-2 px-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <span className="text-slate-300 text-sm">Top device: </span>
          <span className="text-white font-bold">
            {DEVICE_ICONS[segments[0].device]} {formatDeviceName(segments[0].device)}
          </span>
          <span className="text-emerald-400 font-bold ml-2">
            {segments[0].percentage.toFixed(0)}% of {metric}
          </span>
        </motion.div>
      )}
    </div>
  );
}
