"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { WrapPlayer } from "@/components/wrap/WrapPlayer";
import type { Slide } from "@/lib/wrapSlides";

interface WrapData {
  id: string;
  title: string;
  wrap_type: string;
  year: number;
  slides_data: Slide[];
}

export default function SharedWrapPage() {
  const params = useParams();
  const code = params.code as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [wrapData, setWrapData] = useState<WrapData | null>(null);
  const [passwordError, setPasswordError] = useState("");

  const fetchWrap = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/wraps/public/${code}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.requiresPassword) {
          setRequiresPassword(true);
        } else {
          setError(data.error || "Failed to load Wrapped");
        }
        setLoading(false);
        return;
      }

      setWrapData(data.wrap);
      setRequiresPassword(false);
    } catch (err) {
      setError("Failed to load Wrapped");
    } finally {
      setLoading(false);
    }
  };

  const verifyPassword = async () => {
    setPasswordError("");
    try {
      const res = await fetch(`/api/wraps/public/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || "Invalid password");
        return;
      }

      setWrapData(data.wrap);
      setRequiresPassword(false);
    } catch (err) {
      setPasswordError("Failed to verify password");
    }
  };

  useEffect(() => {
    if (code) {
      fetchWrap();
    }
  }, [code]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      verifyPassword();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your Wrapped...</p>
        </div>
      </div>
    );
  }

  // Password required
  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 rounded-2xl border border-white/10 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">Password Protected</h1>
              <p className="text-slate-400 text-sm mt-2">
                This Wrapped is password protected. Enter the password to view.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-400 text-sm">{passwordError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition"
              >
                View Wrapped
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Unable to Load</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  // Render the Wrapped
  if (wrapData) {
    return (
      <WrapPlayer
        slides={wrapData.slides_data}
      />
    );
  }

  return null;
}
