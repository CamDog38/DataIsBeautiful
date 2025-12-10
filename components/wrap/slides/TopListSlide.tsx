"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface ListItem {
  name?: string;
  title?: string;
  value?: string | number;
  views?: number;
  likes?: number;
}

export function TopListSlide({ slide }: { slide: Slide }) {
  const items = (slide.payload?.items as ListItem[]) || [];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-8">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.35),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.3),transparent_50%)] opacity-50"
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

        <motion.div
          className="mt-6 w-full space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          {items.map((item, index) => (
            <motion.div
              key={item.name || item.title || index}
              className="flex items-center justify-between rounded-2xl bg-black/30 px-4 py-3 backdrop-blur-sm border border-white/10"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-slate-50">
                  #{index + 1}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-50">
                    {item.name || item.title}
                  </div>
                  {/* Show value if present */}
                  {item.value !== undefined && (
                    <div className="text-[11px] text-slate-300/80">
                      {typeof item.value === "number"
                        ? item.value.toLocaleString()
                        : item.value}
                    </div>
                  )}
                  {/* Show views/likes if present (for social posts) */}
                  {(item.views !== undefined || item.likes !== undefined) && (
                    <div className="text-[11px] text-slate-300/80">
                      {item.views !== undefined && (
                        <span>{(item.views ?? 0).toLocaleString()} views</span>
                      )}
                      {item.views !== undefined && item.likes !== undefined && (
                        <span> · </span>
                      )}
                      {item.likes !== undefined && (
                        <span>{(item.likes ?? 0).toLocaleString()} likes</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
