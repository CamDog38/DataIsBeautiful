"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface Wrap {
  id: string;
  title: string;
  wrap_type: string;
  year: number;
  share_code: string;
  view_count: number;
  is_active: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [wraps, setWraps] = useState<Wrap[]>([]);
  const [loadingWraps, setLoadingWraps] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchWraps();
    }
  }, [user]);

  const fetchWraps = async () => {
    try {
      const res = await fetch("/api/wraps");
      if (res.ok) {
        const data = await res.json();
        setWraps(data.wraps || []);
      }
    } catch (error) {
      console.error("Failed to fetch wraps:", error);
    } finally {
      setLoadingWraps(false);
    }
  };

  const handleDeleteWrap = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wrap? This cannot be undone.")) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/wraps/${id}`, { method: "DELETE" });
      if (res.ok) {
        setWraps((prev) => prev.filter((wrap) => wrap.id !== id));
      } else {
        console.error("Failed to delete wrap");
      }
    } catch (error) {
      console.error("Error deleting wrap:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const getWrapTypeIcon = (type: string) => {
    switch (type) {
      case "ecommerce": return "🛒";
      case "ads": return "📊";
      case "social": return "📱";
      default: return "📈";
    }
  };

  const getWrapTypeColor = (type: string) => {
    switch (type) {
      case "ecommerce": return "from-emerald-500 to-teal-500";
      case "ads": return "from-blue-500 to-purple-500";
      case "social": return "from-pink-500 to-rose-500";
      default: return "from-purple-500 to-pink-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Data Is Beautiful
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ""}! 👋
          </h1>
          <p className="text-slate-400">Manage your Wrapped reports and share them with the world.</p>
        </motion.div>

        {/* Create New Section */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">Create New Wrap</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { type: "ecommerce", title: "E-commerce", desc: "Revenue, orders, products", href: "/create/ecommerce" },
              { type: "ads", title: "Ads", desc: "Spend, ROAS, campaigns", href: "/create/ads" },
              { type: "social", title: "Social Media", desc: "Followers, engagement, posts", href: "/create/social" },
            ].map((item) => (
              <Link
                key={item.type}
                href={item.href}
                className="group bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getWrapTypeColor(item.type)} flex items-center justify-center text-2xl mb-4`}>
                  {getWrapTypeIcon(item.type)}
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                  {item.title} Wrapped
                </h3>
                <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Saved Wraps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">Your Wraps</h2>
          
          {loadingWraps ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : wraps.length === 0 ? (
            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Wraps yet</h3>
              <p className="text-slate-400 mb-6">Create your first Wrapped report to get started.</p>
              <Link
                href="/wrap-ecomm"
                className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Create Your First Wrap
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wraps.map((wrap) => (
                <motion.div
                  key={wrap.id}
                  className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getWrapTypeColor(wrap.wrap_type)} flex items-center justify-center text-xl`}>
                      {getWrapTypeIcon(wrap.wrap_type)}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${wrap.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}`}>
                      {wrap.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-1">{wrap.title || "Untitled Wrap"}</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {wrap.year} • {wrap.view_count} views
                  </p>

                  <div className="flex gap-2">
                    <Link
                      href={`/wrap/${wrap.share_code}`}
                      className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white text-center hover:bg-white/10 transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/wrap/${wrap.share_code}`);
                      }}
                      className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-sm text-purple-400 hover:bg-purple-500/30 transition-colors"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => handleDeleteWrap(wrap.id)}
                      disabled={deletingId === wrap.id}
                      className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-sm text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {deletingId === wrap.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
