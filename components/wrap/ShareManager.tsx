"use client";

import { useState, useEffect, useCallback } from "react";

interface Share {
  id: string;
  share_code: string;
  title: string | null;
  wrap_type: string;
  year: number | null;
  is_password_protected: boolean | null;
  expires_at: string | null;
  is_active: boolean | null;
  is_revoked: boolean | null;
  view_count: number | null;
  last_viewed_at: string | null;
  created_at: string | null;
}

interface ShareManagerProps {
  email: string;
}

export function ShareManager({ email }: ShareManagerProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchShares = useCallback(async () => {
    try {
      const res = await fetch(`/api/shares?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok) {
        setShares(data.shares || []);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to load shares");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const handleAction = async (code: string, action: string, extra?: Record<string, unknown>) => {
    setActionLoading(code);
    try {
      const res = await fetch(`/api/shares/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        fetchShares();
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm("Are you sure you want to delete this share? This cannot be undone.")) {
      return;
    }
    setActionLoading(code);
    try {
      const res = await fetch(`/api/shares/${code}`, { method: "DELETE" });
      if (res.ok) {
        fetchShares();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/wrap/${code}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const getStatusBadge = (share: Share) => {
    if (share.is_revoked) {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">Revoked</span>;
    }
    if (!share.is_active) {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-500/20 text-slate-400">Inactive</span>;
    }
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">Expired</span>;
    }
    return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400">Active</span>;
  };

  const getWrapTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      ecommerce: "bg-emerald-500/20 text-emerald-400",
      ads: "bg-orange-500/20 text-orange-400",
      social: "bg-pink-500/20 text-pink-400",
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${colors[type] || "bg-slate-500/20 text-slate-400"}`}>
        {type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No shared links yet</h3>
        <p className="text-slate-400 text-sm">
          Generate a Wrapped and share it to see your links here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shares.map((share) => (
        <div
          key={share.id}
          className="bg-slate-900/50 border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-white truncate">
                  {share.title || `Wrapped ${share.share_code}`}
                </h3>
                {getStatusBadge(share)}
                {getWrapTypeBadge(share.wrap_type)}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>Code: {share.share_code}</span>
                {share.year && <span>Year: {share.year}</span>}
                <span>Views: {share.view_count || 0}</span>
                {share.is_password_protected && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Protected
                  </span>
                )}
              </div>
              {share.expires_at && (
                <p className="text-xs text-slate-500 mt-1">
                  Expires: {new Date(share.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyLink(share.share_code)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Copy link"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>

              <a
                href={`/wrap/${share.share_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="View"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </a>

              {share.is_revoked || !share.is_active ? (
                <button
                  onClick={() => handleAction(share.share_code, "activate")}
                  disabled={actionLoading === share.share_code}
                  className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition disabled:opacity-50"
                  title="Activate"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => handleAction(share.share_code, "revoke")}
                  disabled={actionLoading === share.share_code}
                  className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition disabled:opacity-50"
                  title="Revoke"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </button>
              )}

              <button
                onClick={() => handleDelete(share.share_code)}
                disabled={actionLoading === share.share_code}
                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition disabled:opacity-50"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
