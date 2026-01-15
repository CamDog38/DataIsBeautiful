"use client";

import { useEffect, useMemo, useState } from "react";

type MetaAdAccount = {
  id: string;
  ad_account_id: string;
  ad_account_name: string | null;
  currency: string | null;
  timezone_name: string | null;
  is_active: boolean;
};

type MetaConnection = {
  id: string;
  user_id: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  meta_ad_accounts: MetaAdAccount[];
};

const PLATFORM_INFO = {
  google_ads: { name: "Google Ads", icon: "google", color: "#4285F4" },
  meta_ads: { name: "Meta Ads", icon: "meta", color: "#0081FB" },
  linkedin_ads: { name: "LinkedIn Ads", icon: "linkedin", color: "#0A66C2" },
} as const;

type PlatformKey = keyof typeof PLATFORM_INFO;

export function MetaConnector() {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<MetaConnection[]>([]);

  const [showCompanyPopup, setShowCompanyPopup] = useState(false);
  const [companyName, setCompanyName] = useState("");

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/meta/connections", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to fetch Meta connections");
      }
      setConnections(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch Meta connections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as any;
      if (!data || typeof data !== "object") return;
      if (data.source !== "meta-oauth" || data.type !== "connection_complete") return;

      setConnecting(false);
      if (!data.success) {
        setError(typeof data.error === "string" ? data.error : "Meta connection failed");
      } else {
        setError(null);
      }
      fetchConnections();
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const mostRecent = useMemo(() => {
    if (!connections.length) return null;
    const sorted = [...connections].sort((a, b) => {
      const ad = new Date(a.updated_at).getTime();
      const bd = new Date(b.updated_at).getTime();
      return bd - ad;
    });
    return sorted[0] || null;
  }, [connections]);

  const isConnected = !!mostRecent;

  const getMetaStatusText = () => {
    if (loading) return "Loading...";
    if (isConnected) return "Connected";
    return "Not connected";
  };

  const getMetaStatusColor = () => {
    if (loading) return "text-slate-400";
    if (isConnected) return "text-green-400";
    return "text-slate-400";
  };

  const startConnect = async (clientCompanyName: string) => {
    try {
      setConnecting(true);
      setError(null);
      const url = `/api/meta/oauth/start?companyName=${encodeURIComponent(clientCompanyName)}`;
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start Meta OAuth");
      setConnecting(false);
    }
  };

  const renderIcon = (platform: PlatformKey) => {
    const info = PLATFORM_INFO[platform];
    if (info.icon === "google") {
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill={info.color}>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      );
    }
    if (info.icon === "meta") {
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill={info.color}>
          <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill={info.color}>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  };

  const renderRow = (platform: PlatformKey) => {
    const info = PLATFORM_INFO[platform];

    const isMeta = platform === "meta_ads";
    const statusText = isMeta ? getMetaStatusText() : "Not connected";
    const statusColor = isMeta ? getMetaStatusColor() : "text-slate-400";

    return (
      <div
        key={platform}
        className="rounded-xl border border-white/10 bg-slate-800/50 p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${info.color}20` }}
          >
            {renderIcon(platform)}
          </div>

          <div>
            <h3 className="font-medium text-white">{info.name}</h3>
            <p className={`text-sm ${statusColor}`}>{statusText}</p>
            {isMeta && isConnected && mostRecent?.meta_ad_accounts?.length ? (
              <div className="text-xs text-slate-500 mt-1">
                {mostRecent.meta_ad_accounts.length} ad account{mostRecent.meta_ad_accounts.length !== 1 ? "s" : ""} connected
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMeta ? (
            isConnected ? (
              <button
                onClick={() => fetchConnections()}
                disabled={connecting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-white hover:bg-slate-600 transition disabled:opacity-50"
              >
                Refresh
              </button>
            ) : (
              <button
                onClick={() => {
                  setCompanyName("");
                  setShowCompanyPopup(true);
                }}
                disabled={connecting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-slate-900 hover:bg-slate-100 transition disabled:opacity-50 flex items-center gap-2"
              >
                {connecting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>Connect</>
                )}
              </button>
            )
          ) : (
            <button
              disabled
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-slate-400 cursor-not-allowed"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-300 hover:text-red-200"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {renderRow("google_ads")}
        {renderRow("meta_ads")}
        {renderRow("linkedin_ads")}
      </div>

      {showCompanyPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Who is this report for?</h3>
            <p className="text-sm text-slate-400 mb-4">
              Enter the company or client name. This allows multiple connects for different clients.
            </p>

            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Acme Corp, Client ABC"
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && companyName.trim()) {
                  setShowCompanyPopup(false);
                  startConnect(companyName.trim());
                }
              }}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCompanyPopup(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (companyName.trim()) {
                    setShowCompanyPopup(false);
                    startConnect(companyName.trim());
                  }
                }}
                disabled={!companyName.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
