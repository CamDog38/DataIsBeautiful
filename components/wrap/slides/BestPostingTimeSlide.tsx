"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface BestTimePayload {
  bestDay: string;
  peakHours: string;
  platform: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = ["6am", "9am", "12pm", "3pm", "6pm", "9pm"];

export function BestPostingTimeSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as BestTimePayload;
  const { bestDay, peakHours, platform } = payload;

  // Parse best day to highlight
  const bestDayIndex = DAYS.findIndex((d) => 
    bestDay?.toLowerCase().startsWith(d.toLowerCase())
  );

  // Parse peak hours (e.g., "7-9 PM" -> highlight evening)
  const isPeakEvening = peakHours?.toLowerCase().includes("pm") && 
    (peakHours.includes("6") || peakHours.includes("7") || peakHours.includes("8") || peakHours.includes("9"));
  const isPeakAfternoon = peakHours?.toLowerCase().includes("pm") && 
    (peakHours.includes("12") || peakHours.includes("1") || peakHours.includes("2") || peakHours.includes("3"));
  const isPeakMorning = peakHours?.toLowerCase().includes("am");

  // Generate heatmap data (simulated based on best day/time)
  const heatmapData = DAYS.map((day, dayIdx) => 
    HOURS.map((hour, hourIdx) => {
      let intensity = 0.2 + Math.random() * 0.3;
      
      // Boost intensity for best day
      if (dayIdx === bestDayIndex) intensity += 0.3;
      
      // Boost intensity for peak hours
      if (isPeakEvening && hourIdx >= 4) intensity += 0.25;
      if (isPeakAfternoon && hourIdx >= 2 && hourIdx <= 3) intensity += 0.25;
      if (isPeakMorning && hourIdx <= 1) intensity += 0.25;
      
      return Math.min(intensity, 1);
    })
  );

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-10">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.4),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.3),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
          {slide.subtitle && (
            <p className="text-sm text-slate-400 mt-1">{slide.subtitle}</p>
          )}
        </motion.div>

        {/* Heatmap grid */}
        <motion.div
          className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Hour labels */}
          <div className="flex mb-2 pl-12">
            {HOURS.map((hour) => (
              <div key={hour} className="flex-1 text-center text-[10px] text-slate-500">
                {hour}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          <div className="space-y-1">
            {DAYS.map((day, dayIdx) => (
              <motion.div
                key={day}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + dayIdx * 0.05 }}
              >
                <div className={`w-10 text-xs font-medium ${dayIdx === bestDayIndex ? "text-emerald-400" : "text-slate-400"}`}>
                  {day}
                </div>
                <div className="flex-1 flex gap-1">
                  {heatmapData[dayIdx].map((intensity, hourIdx) => (
                    <motion.div
                      key={hourIdx}
                      className="flex-1 h-6 rounded"
                      style={{
                        backgroundColor: `rgba(139, 92, 246, ${intensity})`,
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + dayIdx * 0.05 + hourIdx * 0.02 }}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
            <span>Low</span>
            <div className="flex gap-0.5">
              {[0.2, 0.4, 0.6, 0.8, 1].map((i) => (
                <div
                  key={i}
                  className="w-4 h-3 rounded-sm"
                  style={{ backgroundColor: `rgba(139, 92, 246, ${i})` }}
                />
              ))}
            </div>
            <span>High</span>
          </div>
        </motion.div>

        {/* Best time callouts */}
        <motion.div
          className="flex justify-center gap-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {bestDay && (
            <div className="text-center">
              <div className="text-2xl mb-1">📅</div>
              <div className="text-xs text-slate-500 uppercase">Best Day</div>
              <div className="text-lg font-bold text-emerald-400">{bestDay}</div>
            </div>
          )}
          {peakHours && (
            <div className="text-center">
              <div className="text-2xl mb-1">⏰</div>
              <div className="text-xs text-slate-500 uppercase">Peak Hours</div>
              <div className="text-lg font-bold text-purple-400">{peakHours}</div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
