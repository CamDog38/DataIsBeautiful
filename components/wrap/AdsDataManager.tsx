"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdChannel,
  ChannelData,
  AggregatedAdsData,
  CampaignData,
  aggregateChannelData,
  emptyAggregatedData,
} from "../../lib/adsDataTypes";
import { AdsChannelUploader } from "./AdsChannelUploader";

const ADS_DATA_STORAGE_KEY = "ads-wrapped-channels-data";

interface AdsDataManagerProps {
  onDataChange: (data: AggregatedAdsData) => void;
  initialData?: AggregatedAdsData;
  currencySymbol?: string;
}

export function AdsDataManager({ onDataChange, initialData, currencySymbol = "$" }: AdsDataManagerProps) {
  const [channels, setChannels] = useState<ChannelData[]>(initialData?.channels || []);
  const [aggregatedData, setAggregatedData] = useState<AggregatedAdsData>(initialData || emptyAggregatedData);
  const [uploaderChannel, setUploaderChannel] = useState<AdChannel | null>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<CampaignData[]>([]);
  const [manualCampaigns, setManualCampaigns] = useState<CampaignData[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(ADS_DATA_STORAGE_KEY);
    if (stored && !initialData) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.channels) {
          setChannels(parsed.channels);
          setSelectedCampaigns(parsed.selectedCampaigns || []);
          setManualCampaigns(parsed.manualCampaigns || []);
        }
      } catch {}
    }
  }, []);

  // Recalculate aggregated data when channels change
  useEffect(() => {
    const newAggregated = aggregateChannelData(channels);
    setAggregatedData(newAggregated);
    onDataChange(newAggregated);
    
    // Save to localStorage
    localStorage.setItem(ADS_DATA_STORAGE_KEY, JSON.stringify({
      channels,
      selectedCampaigns,
      manualCampaigns,
    }));
  }, [channels, selectedCampaigns, manualCampaigns, onDataChange]);

  const handleChannelData = useCallback((data: ChannelData) => {
    setChannels(prev => {
      // Replace existing channel data or add new
      const existing = prev.findIndex(c => c.channel === data.channel);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = data;
        return updated;
      }
      return [...prev, data];
    });
  }, []);

  const removeChannel = useCallback((channel: AdChannel) => {
    setChannels(prev => prev.filter(c => c.channel !== channel));
  }, []);

  const getChannelData = (channel: AdChannel): ChannelData | null => {
    return channels.find(c => c.channel === channel) || null;
  };

  const formatCurrency = (val: number | null | undefined) =>
    currencySymbol + (val ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const formatNumber = (val: number | null | undefined) =>
    (val ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

  // CPR can be extremely small for objectives like Reach; avoid showing it as exactly 0
  const formatCpr = (val: number | null | undefined) => {
    const n = val ?? 0;
    if (n > 0 && n < 0.01) {
      return `${currencySymbol}<0.01`;
    }
    return formatCurrency(n);
  };

  const channelButtons: { channel: AdChannel; name: string; color: string; icon: string }[] = [
    { channel: "meta", name: "Meta Ads", color: "blue", icon: "M" },
    { channel: "google", name: "Google Ads", color: "red", icon: "G" },
    { channel: "tiktok", name: "TikTok Ads", color: "pink", icon: "T" },
    { channel: "linkedin", name: "LinkedIn Ads", color: "sky", icon: "in" },
  ];

  return (
    <div className="space-y-6">
      {/* Import Buttons */}
      <div className="flex flex-wrap gap-3">
        {channelButtons.map(({ channel, name, color, icon }) => {
          const hasData = getChannelData(channel);
          return (
            <button
              key={channel}
              onClick={() => setUploaderChannel(channel)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition border ${
                hasData
                  ? `bg-${color}-500/20 border-${color}-400/60 text-${color}-300 hover:bg-${color}-500/30`
                  : "bg-white/5 border-white/20 text-slate-300 hover:bg-white/10 hover:border-white/40"
              }`}
            >
              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                hasData ? `bg-${color}-500 text-white` : "bg-slate-700 text-slate-400"
              }`}>
                {icon}
              </span>
              {hasData ? `${name} ✓` : `Import ${name}`}
            </button>
          );
        })}
      </div>

      {/* Imported Channels Summary */}
      {channels.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white">Imported Channels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map(channel => (
              <div
                key={channel.channel}
                className="p-4 rounded-xl bg-slate-800/50 border border-white/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">{channel.channelName}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUploaderChannel(channel.channel)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Re-upload
                    </button>
                    <button
                      onClick={() => removeChannel(channel.channel)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-slate-400">Spend</div>
                    <div className="text-white font-medium">{formatCurrency(channel.spend)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Results</div>
                    <div className="text-cyan-400 font-medium">{formatNumber(channel.results)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">CPR</div>
                    <div className="text-green-400 font-medium">{formatCurrency(channel.cpr)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Impressions</div>
                    <div className="text-white font-medium">{formatNumber(channel.impressions)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">CPM</div>
                    <div className="text-white font-medium">{formatCurrency(channel.cpm)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Campaigns</div>
                    <div className="text-white font-medium">{channel.campaigns.length}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aggregated Totals */}
      {channels.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-400/20">
          <h3 className="text-sm font-medium text-white mb-3">Combined Totals (Auto-calculated)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-xs text-slate-400">Total Spend</div>
              <div className="text-lg font-semibold text-white">{formatCurrency(aggregatedData.totalSpend)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Total Results</div>
              <div className="text-lg font-semibold text-cyan-400">{formatNumber(aggregatedData.totalResults)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Avg CPR</div>
              <div className="text-lg font-semibold text-white">{formatCpr(aggregatedData.averageCpr)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Avg CPM</div>
              <div className="text-lg font-semibold text-white">{formatCurrency(aggregatedData.averageCpm)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Avg CTR</div>
              <div className="text-lg font-semibold text-white">{aggregatedData.averageCtr.toFixed(2)}%</div>
            </div>
          </div>
          
          {/* Results by Type */}
          {aggregatedData.resultsByType.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-slate-800/30">
              <div className="text-xs text-slate-400 mb-2">Results Breakdown by Type</div>
              <div className="flex flex-wrap gap-2">
                {aggregatedData.resultsByType.map((r) => (
                  <div key={r.type} className="px-2 py-1 rounded bg-slate-700/50 text-xs">
                    <span className="text-white font-medium">{formatNumber(r.count)}</span>
                    <span className="text-slate-400 ml-1">{r.typeName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Channel Breakdown */}
      {aggregatedData.topChannelBySpend && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white">Channel Breakdown (Auto-calculated)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Channel */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10">
              <div className="text-xs text-slate-400 mb-1">Top Channel by Spend</div>
              <div className="text-lg font-semibold text-white">{aggregatedData.topChannelBySpend.channelName}</div>
              <div className="text-sm text-slate-300 mt-1">
                {formatCurrency(aggregatedData.topChannelBySpend.spend)} spend • {formatNumber(aggregatedData.topChannelBySpend.results)} results • {formatCpr(aggregatedData.topChannelBySpend.cpr)} CPR
              </div>
            </div>
            
            {/* Second Channel */}
            {aggregatedData.secondChannel && (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10">
                <div className="text-xs text-slate-400 mb-1">Second Channel</div>
                <div className="text-lg font-semibold text-white">{aggregatedData.secondChannel.channelName}</div>
                <div className="text-sm text-slate-300 mt-1">
                  {formatCurrency(aggregatedData.secondChannel.spend)} spend • {formatNumber(aggregatedData.secondChannel.results)} results • {formatCpr(aggregatedData.secondChannel.cpr)} CPR
                </div>
              </div>
            )}
            
            {/* Best CPR Channel */}
            {channels.length > 1 && (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10">
                <div className="text-xs text-slate-400 mb-1">Best CPR Channel</div>
                <div className="text-lg font-semibold text-white">
                  {[...channels].filter(c => c.results > 0).sort((a, b) => a.cpr - b.cpr)[0]?.channelName || "N/A"}
                </div>
                <div className="text-sm text-green-400 mt-1">
                  {formatCpr([...channels].filter(c => c.results > 0).sort((a, b) => a.cpr - b.cpr)[0]?.cpr || 0)} CPR
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Campaigns - sorted by results */}
      {aggregatedData.topCampaignsByRevenue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Top Campaigns by Results (Auto-calculated)</h3>
            <button className="text-xs text-orange-400 hover:text-orange-300">
              + Add Campaign Manually
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">#</th>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Campaign</th>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Result Type</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium">Results</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium">Spend</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium">CPR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[...aggregatedData.topCampaignsByRevenue].sort((a, b) => b.results - a.results).slice(0, 5).map((campaign, idx) => (
                  <tr key={campaign.id} className="hover:bg-white/5">
                    <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2 text-white truncate max-w-[180px]" title={campaign.name}>
                      {campaign.name}
                    </td>
                    <td className="px-3 py-2 text-slate-400 text-xs">
                      {campaign.primaryResultTypeName || "—"}
                    </td>
                    <td className="px-3 py-2 text-cyan-400 text-right">{formatNumber(campaign.results)}</td>
                    <td className="px-3 py-2 text-slate-300 text-right">{formatCurrency(campaign.spend)}</td>
                    <td className="px-3 py-2 text-green-400 text-right">{formatCpr(campaign.cpr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Most Efficient Campaign - by CPR */}
          {(() => {
            const efficientCampaigns = [...aggregatedData.topCampaignsByRevenue].filter(c => c.results > 0).sort((a, b) => a.cpr - b.cpr);
            const mostEfficient = efficientCampaigns[0];
            return mostEfficient ? (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                <span className="text-green-400 font-medium">Most Efficient Campaign (Lowest CPR):</span>
                <span className="text-white ml-2">{mostEfficient.name}</span>
                <span className="text-slate-400 ml-2">
                  ({formatCpr(mostEfficient.cpr)} CPR • {formatNumber(mostEfficient.results)} results)
                </span>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Best Month - by CPR */}
      {aggregatedData.bestMonthByCpr && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10">
            <div className="text-xs text-slate-400 mb-1">Best Month for Efficiency (Lowest CPR)</div>
            <div className="text-lg font-semibold text-white">{aggregatedData.bestMonthByCpr.month}</div>
            <div className="text-sm text-green-400 mt-1">
              {formatCurrency(aggregatedData.bestMonthByCpr.cpr)} CPR
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {channels.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-lg font-medium text-white mb-2">No ad data imported yet</p>
          <p className="text-sm">Import your Meta Ads or Google Ads exports to get started</p>
        </div>
      )}

      {/* Uploader Modal */}
      {uploaderChannel && (
        <AdsChannelUploader
          channel={uploaderChannel}
          onDataParsed={handleChannelData}
          onClose={() => setUploaderChannel(null)}
          existingData={getChannelData(uploaderChannel)}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
