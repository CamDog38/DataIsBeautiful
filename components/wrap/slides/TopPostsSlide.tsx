"use client";

import { motion } from "framer-motion";
import type { Slide } from "../../../lib/wrapSlides";

interface TopPost {
  rank: number;
  description: string;
  likes: number;
  comments: number;
  url?: string;
  format?: string;
}

interface TopPostsPayload {
  posts: TopPost[];
  platform: string;
}

export function TopPostsSlide({ slide }: { slide: Slide }) {
  const payload = slide.payload as TopPostsPayload;
  const { posts, platform } = payload;

  const getPlatformIcon = (p: string) => {
    const lower = p.toLowerCase();
    if (lower.includes("instagram")) return "📸";
    if (lower.includes("tiktok")) return "🎵";
    if (lower.includes("twitter") || lower.includes("x")) return "🐦";
    if (lower.includes("facebook")) return "👤";
    if (lower.includes("linkedin")) return "💼";
    if (lower.includes("youtube")) return "▶️";
    return "📱";
  };

  const maxLikes = Math.max(...posts.map((p) => p.likes));

  return (
    <div className="relative flex h-full w-full flex-col px-10 py-8">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.5),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.4),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-3xl">{getPlatformIcon(platform)}</span>
          <div>
            <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
            {slide.subtitle && (
              <p className="text-sm text-slate-400">{slide.subtitle}</p>
            )}
          </div>
        </motion.div>

        {/* Posts list */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          {posts.map((post, i) => {
            const barWidth = (post.likes / maxLikes) * 100;

            return (
              <motion.div
                key={i}
                className="relative"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.15 }}
              >
                {/* Card */}
                <div className="relative bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4 overflow-hidden">
                  {/* Background bar */}
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20"
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: 0.5 + i * 0.15, duration: 0.6 }}
                  />

                  <div className="relative flex items-center gap-4">
                    {/* Rank badge */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {post.rank}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {post.description}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-pink-400">
                          ❤️ {post.likes.toLocaleString()}
                        </span>
                        <span className="text-xs text-purple-400">
                          💬 {post.comments.toLocaleString()}
                        </span>
                        {post.format && (
                          <span className="text-xs text-slate-500 px-2 py-0.5 bg-white/5 rounded-full">
                            {post.format}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View link */}
                    {post.url && (
                      <motion.a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View Post →
                      </motion.a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer insight */}
        <motion.div
          className="text-center text-xs text-slate-500 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Your top post received{" "}
          <span className="text-pink-400 font-bold">
            {posts[0]?.likes.toLocaleString()}
          </span>{" "}
          likes
        </motion.div>
      </div>
    </div>
  );
}
