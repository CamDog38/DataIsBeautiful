"use client";

import { useState } from "react";

export default function SnowflakeSchemaDebugPage() {
  const [schema, setSchema] = useState("user_demo_user_google_ads");
  const [tables, setTables] = useState("ACCOUNT_STATS,CAMPAIGN_STATS,CAMPAIGN_HISTORY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams();
      params.set("schema", schema);
      if (tables.trim()) {
        params.set("tables", tables.trim());
      }

      const res = await fetch(`/api/snowflake/schema?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Request failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${schema}_schema.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Snowflake Schema Debug</h1>
        <p className="text-sm text-slate-400">
          Runs an aggregated schema query against FIVETRAN_DATABASE.INFORMATION_SCHEMA.COLUMNS
          and returns the structure grouped by table.
        </p>

        <div className="space-y-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Schema name
            </label>
            <input
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="user_demo_user_google_ads"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Tables (comma-separated, optional)
            </label>
            <input
              value={tables}
              onChange={(e) => setTables(e.target.value)}
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="ACCOUNT_STATS,CAMPAIGN_STATS,CAMPAIGN_HISTORY"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-sky-600 text-sm font-medium disabled:opacity-50 hover:bg-sky-500"
            >
              {loading ? "Running..." : "Run query"}
            </button>

            <button
              onClick={handleDownload}
              disabled={!result}
              className="px-4 py-2 rounded-md bg-slate-800 text-sm font-medium disabled:opacity-40 hover:bg-slate-700"
            >
              Download JSON
            </button>
          </div>

          {error && (
            <div className="text-xs text-red-400 mt-2">Error: {error}</div>
          )}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-slate-200">Response</h2>
            <span className="text-[11px] text-slate-500">
              {result ? "Showing latest result" : "No data yet"}
            </span>
          </div>
          <pre className="text-xs bg-slate-950/80 rounded-lg p-3 overflow-auto max-h-[480px]">
            {result ? JSON.stringify(result, null, 2) : "// Run the query to see JSON output here"}
          </pre>
        </div>
      </div>
    </div>
  );
}
