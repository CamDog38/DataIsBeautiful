"use client";

import { useState, useEffect } from "react";
import { FIVETRAN_SERVICES, SERVICE_INFO, type FivetranService } from "@/lib/fivetran";

interface Connection {
  id: string;
  service: string;
  schema: string;
  companyName?: string;
  status: {
    setupState: string;
    syncState: string;
    updateState: string;
    isHistoricalSync: boolean;
  };
}

interface FivetranConnectorProps {
  userId: string;
  wrapType: "ads" | "ecommerce" | "social";
  onConnectionComplete?: (connection: Connection) => void;
  onGenerateWrapped?: (connectedServices: string[], companyName: string) => void;
}

// Map wrap types to relevant Fivetran services
const WRAP_TYPE_SERVICES: Record<string, FivetranService[]> = {
  ads: [FIVETRAN_SERVICES.GOOGLE_ADS, FIVETRAN_SERVICES.META_ADS, FIVETRAN_SERVICES.LINKEDIN_ADS],
  ecommerce: [], // Will add Shopify, etc. later
  social: [], // Will add Instagram, etc. later
};

export function FivetranConnector({ userId, wrapType, onConnectionComplete, onGenerateWrapped }: FivetranConnectorProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingWrap, setGeneratingWrap] = useState(false);
  const [lastConnectionId, setLastConnectionId] = useState<string | null>(null);
  
  // Company name popup state
  const [showCompanyPopup, setShowCompanyPopup] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [pendingService, setPendingService] = useState<FivetranService | null>(null);

  const availableServices = WRAP_TYPE_SERVICES[wrapType] || [];
  
  // Group connections by company
  const connectionsByCompany = connections.reduce((acc, conn) => {
    const company = conn.companyName || "Unknown";
    if (!acc[company]) acc[company] = [];
    acc[company].push(conn);
    return acc;
  }, {} as Record<string, Connection[]>);

  // Get list of connected services (for backward compat, use first company)
  const connectedServices = connections
    .filter((conn) => conn.status.setupState === "connected")
    .map((conn) => conn.service);
  
  const hasConnectedServices = connectedServices.length > 0;
  
  // Get unique company names with connected services
  const companiesWithConnections = Object.entries(connectionsByCompany)
    .filter(([_, conns]) => conns.some(c => c.status.setupState === "connected"))
    .map(([company]) => company);
  
  // Check if any connection is currently syncing
  const isSyncing = connections.some(
    (conn) => conn.status.syncState === "syncing" || conn.status.isHistoricalSync
  );

  // Fetch existing connections on mount
  useEffect(() => {
    fetchConnections();
  }, [userId]);

  // While any connection is syncing, periodically refresh status
  useEffect(() => {
    if (!isSyncing) return;

    const intervalId = setInterval(() => {
      fetchConnections();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isSyncing, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.source !== "fivetran-connect-card" || data.type !== "connection_complete") return;

      setConnecting(null);
      fetchConnections();

      const payload = data as any;
      const messageConnectionId = typeof payload.connectionId === "string" ? payload.connectionId : null;
      const idToSync = messageConnectionId || lastConnectionId;

      if (payload.success && idToSync) {
        triggerSync(idToSync);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [lastConnectionId]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fivetran/connections?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setConnections(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to fetch connections");
    } finally {
      setLoading(false);
    }
  };

  // Show company name popup before connecting
  const initiateConnect = (service: FivetranService) => {
    setPendingService(service);
    setCompanyName("");
    setShowCompanyPopup(true);
  };

  // Actually connect after company name is provided
  const connectService = async (service: FivetranService, clientCompanyName: string) => {
    try {
      setConnecting(service);
      setError(null);
      setShowCompanyPopup(false);

      const response = await fetch("/api/fivetran/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, service, companyName: clientCompanyName }),
      });

      const data = await response.json();

      if (data.success && data.data.connectCardUrl) {
        if (typeof data.data.connectionId === "string") {
          setLastConnectionId(data.data.connectionId);
        }
        // Open Fivetran Connect Card in a full browser tab to avoid zoomed mobile layout
        window.open(data.data.connectCardUrl, "_blank");
      } else {
        setError(data.error || "Failed to create connection");
      }
    } catch (err) {
      setError("Failed to connect service");
    } finally {
      setConnecting(null);
    }
  };

  const reconnectService = async (connectionId: string) => {
    try {
      setConnecting(connectionId);
      setError(null);

      const response = await fetch(`/api/fivetran/connections/${connectionId}/connect-card`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success && data.data.connectCardUrl) {
        window.open(data.data.connectCardUrl, "_blank");
      } else {
        setError(data.error || "Failed to generate connect card");
      }
    } catch (err) {
      setError("Failed to reconnect service");
    } finally {
      setConnecting(null);
    }
  };

  const pollSyncAndPause = async (connectionId: string) => {
    const maxAttempts = 20;
    const delayMs = 30000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`/api/fivetran/connections/${connectionId}`);
        const data = await response.json();

        if (!data.success || !data.data?.status) {
          break;
        }

        const status = data.data.status as Connection["status"];

        if (status.syncState !== "syncing" && !status.isHistoricalSync) {
          await fetch(`/api/fivetran/connections/${connectionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "pause" }),
          });

          await fetchConnections();
          break;
        }
      } catch (err) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  };

  const triggerSync = async (connectionId: string) => {
    try {
      setError(null);

      // Ensure the connector is unpaused before triggering a sync
      await fetch(`/api/fivetran/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unpause" }),
      });

      const response = await fetch(`/api/fivetran/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });

      const data = await response.json();
      if (data.success) {
        fetchConnections();
        pollSyncAndPause(connectionId);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to trigger sync");
    }
  };

  const deleteConnection = async (connectionId: string) => {
    if (!confirm("Are you sure you want to disconnect this service?")) return;

    try {
      const response = await fetch(`/api/fivetran/connections/${connectionId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        fetchConnections();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to delete connection");
    }
  };

  const getStatusColor = (status: Connection["status"]) => {
    if (status.setupState === "connected" && status.syncState === "syncing") {
      return "text-green-400";
    }
    if (status.setupState === "incomplete") {
      return "text-yellow-400";
    }
    if (status.setupState === "broken") {
      return "text-red-400";
    }
    return "text-slate-400";
  };

  const getStatusText = (status: Connection["status"]) => {
    if (status.setupState === "connected") {
      if (status.syncState === "syncing") return "Syncing...";
      if (status.syncState === "scheduled") return "Connected";
      return "Connected";
    }
    if (status.setupState === "incomplete") return "Setup incomplete";
    if (status.setupState === "broken") return "Connection broken";
    return status.setupState;
  };

  const isServiceConnected = (service: FivetranService) => {
    return connections.some((conn) => conn.service === service);
  };

  const getConnectionForService = (service: FivetranService) => {
    return connections.find((conn) => conn.service === service);
  };

  if (availableServices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">
          Automatic import is not yet available for this wrap type.
        </p>
      </div>
    );
  }

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
        {availableServices.map((service) => {
          const info = SERVICE_INFO[service];
          const connection = getConnectionForService(service);
          const isConnected = !!connection;
          const isConnecting = connecting === service || connecting === connection?.id;

          return (
            <div
              key={service}
              className="rounded-xl border border-white/10 bg-slate-800/50 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {/* Service Icon */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${info.color}20` }}
                >
                  {info.icon === "google" && (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={info.color}>
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {info.icon === "meta" && (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={info.color}>
                      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                    </svg>
                  )}
                  {info.icon === "linkedin" && (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={info.color}>
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  )}
                </div>

                {/* Service Info */}
                <div>
                  <h3 className="font-medium text-white">{info.name}</h3>
                  {isConnected ? (
                    <p className={`text-sm ${getStatusColor(connection.status)}`}>
                      {getStatusText(connection.status)}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">Not connected</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <button
                      onClick={() => triggerSync(connection.id)}
                      disabled={isConnecting}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-white hover:bg-slate-600 transition disabled:opacity-50"
                    >
                      Sync Now
                    </button>
                    <button
                      onClick={() => reconnectService(connection.id)}
                      disabled={isConnecting}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-white hover:bg-slate-600 transition disabled:opacity-50"
                    >
                      {isConnecting ? "..." : "Reconnect"}
                    </button>
                    <button
                      onClick={() => deleteConnection(connection.id)}
                      disabled={isConnecting}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => initiateConnect(service)}
                    disabled={isConnecting}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-slate-900 hover:bg-slate-100 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isConnecting ? (
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
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-slate-400">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading connections...
          </div>
        </div>
      )}

      {/* Generate Wrapped Button - shows when at least one service is connected */}
      {hasConnectedServices && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex flex-col items-center gap-4">
            {isSyncing && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Data is syncing... First sync may take a few minutes.
              </div>
            )}
            
            <div className="text-sm text-slate-400 text-center">
              <span className="text-green-400 font-medium">{connectedServices.length}</span> platform{connectedServices.length !== 1 ? "s" : ""} connected
              {connectedServices.length > 0 && (
                <span className="text-slate-500"> ({connectedServices.map(s => SERVICE_INFO[s as FivetranService]?.name || s).join(", ")})</span>
              )}
            </div>

            {/* Show company selector if multiple companies */}
            {companiesWithConnections.length > 1 && (
              <div className="w-full max-w-xs mb-4">
                <label className="block text-xs text-slate-400 mb-1">Select company to generate wrap for:</label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm"
                  onChange={(e) => {
                    // Store selected company for wrap generation
                    const selectedCompany = e.target.value;
                    if (selectedCompany) {
                      const companyConns = connectionsByCompany[selectedCompany] || [];
                      const companyServices = companyConns
                        .filter(c => c.status.setupState === "connected")
                        .map(c => c.service);
                      setGeneratingWrap(true);
                      onGenerateWrapped?.(companyServices, selectedCompany);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Choose a company...</option>
                  {companiesWithConnections.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
            )}

            {companiesWithConnections.length === 1 && (
            <button
              onClick={() => {
                const company = companiesWithConnections[0];
                const companyConns = connectionsByCompany[company] || [];
                const companyServices = companyConns
                  .filter(c => c.status.setupState === "connected")
                  .map(c => c.service);
                setGeneratingWrap(true);
                onGenerateWrapped?.(companyServices, company);
              }}
              disabled={generatingWrap || isSyncing}
              className="px-8 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-orange-500/25"
            >
              {generatingWrap ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : isSyncing ? (
                <>Wait for sync to complete</>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Wrapped
                </>
              )}
            </button>
            )}
            
            {!isSyncing && (
              <p className="text-xs text-slate-500">
                Your wrap will be generated using the latest synced data from Snowflake.
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500 text-center mt-4">
        Powered by Fivetran. Your data is synced securely to our data warehouse.
      </p>

      {/* Company Name Popup */}
      {showCompanyPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              Who is this report for?
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Enter the company or client name for this wrap. This allows you to create multiple wraps for different clients.
            </p>
            
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Acme Corp, Client ABC"
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && companyName.trim() && pendingService) {
                  connectService(pendingService, companyName.trim());
                }
              }}
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCompanyPopup(false);
                  setPendingService(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (companyName.trim() && pendingService) {
                    connectService(pendingService, companyName.trim());
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
