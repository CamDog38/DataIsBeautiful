"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface SaveWrapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  wrapType: "ecommerce" | "ads" | "social";
  formData: any;
  slidesData: any[];
  year?: number;
  title?: string;
}

export function SaveWrapDialog({
  isOpen,
  onClose,
  wrapType,
  formData,
  slidesData,
  year,
  title: initialTitle,
}: SaveWrapDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialTitle || "");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ shareUrl: string; shareCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/wraps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || `${wrapType.charAt(0).toUpperCase() + wrapType.slice(1)} Wrapped ${year || new Date().getFullYear()}`,
          wrap_type: wrapType,
          year: year || new Date().getFullYear(),
          form_data: formData,
          slides_data: slidesData,
          password: usePassword ? password : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save wrap");
        return;
      }

      setSuccess({
        shareUrl: `${window.location.origin}${data.shareUrl}`,
        shareCode: data.wrap.share_code,
      });
    } catch (err) {
      setError("Failed to save wrap");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (success) {
      navigator.clipboard.writeText(success.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {!user ? (
            // Not logged in
            <div className="text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-xl font-bold text-white mb-2">Sign in to Save</h2>
              <p className="text-slate-400 text-sm mb-6">
                Create an account to save your Wrapped and share it with others.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/auth/login"
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all text-center"
                >
                  Sign Up
                </Link>
              </div>
              <button
                onClick={onClose}
                className="mt-4 text-sm text-slate-500 hover:text-slate-400"
              >
                Cancel
              </button>
            </div>
          ) : success ? (
            // Success state
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-white mb-2">Wrap Saved!</h2>
              <p className="text-slate-400 text-sm mb-6">
                Your Wrapped is ready to share.
              </p>

              <div className="bg-black/30 rounded-xl p-4 mb-4">
                <div className="text-xs text-slate-500 uppercase mb-2">Share Link</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={success.shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-white text-sm truncate outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      copied
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href={success.shareUrl}
                  target="_blank"
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors text-center"
                >
                  View Wrap
                </Link>
                <Link
                  href="/dashboard"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all text-center"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          ) : (
            // Save form
            <>
              <h2 className="text-xl font-bold text-white mb-4">Save & Share</h2>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`${wrapType.charAt(0).toUpperCase() + wrapType.slice(1)} Wrapped ${year || new Date().getFullYear()}`}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usePassword}
                      onChange={(e) => setUsePassword(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-slate-800 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-sm text-slate-300">Password protect</span>
                  </label>
                </div>

                {usePassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none"
                    />
                  </motion.div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save & Get Link"}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
