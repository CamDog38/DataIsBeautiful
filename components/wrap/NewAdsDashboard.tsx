"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdsDataManager } from "./AdsDataManager";
import { FivetranConnector } from "./FivetranConnector";
import { useAuth } from "@/contexts/AuthContext";
import {
  AggregatedAdsData,
  CampaignData,
  emptyAggregatedData,
} from "../../lib/adsDataTypes";

const ADS_FORM_STORAGE_KEY = "ads-wrapped-form-data-v2";

// Form data for ALL fields - can be auto-populated or manually entered
interface AdsFormData {
  // Basics
  customerName: string;
  currency: string;
  year: string;
  periodType?: "year" | "month" | "custom";
  periodYear?: string;
  periodMonth?: string;
  periodStartDate?: string;
  periodEndDate?: string;
  
  // Overview metrics (can be auto-calculated or manually entered)
  totalAdSpend: string;
  totalConversions: string;
  totalImpressions: string;
  totalClicks: string;
  
  // Revenue & ROAS (manual entry only - not from ad uploads)
  revenueAttributed: string;
  blendedRoas: string;
  
  // Channel breakdown
  topChannelBySpend: string;
  spendOnTopChannel: string;
  topChannelLeads: string;
  topChannelCpl: string;
  secondChannel: string;
  spendOnSecondChannel: string;
  secondChannelLeads: string;
  secondChannelCpl: string;
  
  // Top campaigns (by leads/CPL, not ROAS)
  topCampaign1Name: string;
  topCampaign1Leads: string;
  topCampaign1Spend: string;
  topCampaign1Cpl: string;
  topCampaign2Name: string;
  topCampaign2Leads: string;
  topCampaign2Spend: string;
  topCampaign2Cpl: string;
  mostEfficientCampaign: string;
  mostEfficientCampaignCpl: string;
  
  // Efficiency metrics
  averageCpl: string;
  averageCpm: string;
  averageCpc: string;
  averageCtr: string;
  bestMonthForEfficiency: string;
  bestMonthCpl: string;
  
  // YoY changes (manual)
  yoyCplChange: string;
  yoyRoasChange: string;
  
  // Additional metrics from upload
  totalReach: string;
  conversionRate: string;
}

const initialFormData: AdsFormData = {
  customerName: "",
  currency: "USD",
  year: new Date().getFullYear().toString(),
  periodType: "year",
  periodYear: new Date().getFullYear().toString(),
  periodMonth: "",
  periodStartDate: "",
  periodEndDate: "",
  totalAdSpend: "",
  totalConversions: "",
  totalImpressions: "",
  totalClicks: "",
  revenueAttributed: "",
  blendedRoas: "",
  topChannelBySpend: "",
  spendOnTopChannel: "",
  topChannelLeads: "",
  topChannelCpl: "",
  secondChannel: "",
  spendOnSecondChannel: "",
  secondChannelLeads: "",
  secondChannelCpl: "",
  topCampaign1Name: "",
  topCampaign1Leads: "",
  topCampaign1Spend: "",
  topCampaign1Cpl: "",
  topCampaign2Name: "",
  topCampaign2Leads: "",
  topCampaign2Spend: "",
  topCampaign2Cpl: "",
  mostEfficientCampaign: "",
  mostEfficientCampaignCpl: "",
  averageCpl: "",
  averageCpm: "",
  averageCpc: "",
  averageCtr: "",
  bestMonthForEfficiency: "",
  bestMonthCpl: "",
  yoyCplChange: "",
  yoyRoasChange: "",
  totalReach: "",
  conversionRate: "",
};

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
];

export function NewAdsDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const adsUserId = user?.id || "demo-user";
  const [aggregatedData, setAggregatedData] = useState<AggregatedAdsData>(emptyAggregatedData);
  const [formData, setFormData] = useState<AdsFormData>(initialFormData);
  const [activeSection, setActiveSection] = useState<"import" | "edit">("import");
  const [isGenerating, setIsGenerating] = useState(false);
  const [importMode, setImportMode] = useState<"manual" | "automatic">("manual");

  const [showGeneratePrompt, setShowGeneratePrompt] = useState(false);
  const [generateCompanyName, setGenerateCompanyName] = useState("");
  const [datePreset, setDatePreset] = useState<"this_year" | "last_year" | "this_month" | "last_month" | "custom">("this_year");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [pendingPlatforms, setPendingPlatforms] = useState<string[] | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(ADS_FORM_STORAGE_KEY);
    if (stored) {
      try {
        setFormData(prev => ({ ...prev, ...JSON.parse(stored) }));
      } catch {}
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(ADS_FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const getCurrency = () => CURRENCIES.find(c => c.code === formData.currency) || CURRENCIES[0];
  const formatCurrency = (val: number) => getCurrency().symbol + val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const formatNumber = (val: number) => val.toLocaleString(undefined, { maximumFractionDigits: 0 });

  // When data is imported, auto-populate form fields
  const handleDataChange = useCallback(
    (data: AggregatedAdsData) => {
      setAggregatedData(data);
      
      if (data.channels.length > 0) {
        // Get top campaigns sorted by results (leads), not revenue
        const topCampaignsByLeads = [...data.topCampaignsByRevenue].sort((a, b) => b.results - a.results);
        // Most efficient = lowest CPR with meaningful spend
        const efficientCampaigns = topCampaignsByLeads
          .filter(c => c.results > 0)
          .sort((a, b) => a.cpr - b.cpr);
        
        setFormData(prev => ({
          ...prev,
          // Overview - auto-populate from import
          totalAdSpend: formatCurrency(data.totalSpend),
          totalConversions: formatNumber(data.totalResults),
          totalImpressions: formatNumber(data.totalImpressions),
          totalClicks: formatNumber(data.totalClicks),
          
          // Channel breakdown
          topChannelBySpend: data.topChannelBySpend?.channelName || prev.topChannelBySpend,
          spendOnTopChannel: data.topChannelBySpend ? formatCurrency(data.topChannelBySpend.spend) : prev.spendOnTopChannel,
          topChannelLeads: data.topChannelBySpend ? formatNumber(data.topChannelBySpend.results) : prev.topChannelLeads,
          topChannelCpl: data.topChannelBySpend ? formatCurrency(data.topChannelBySpend.cpr) : prev.topChannelCpl,
          secondChannel: data.secondChannel?.channelName || prev.secondChannel,
          spendOnSecondChannel: data.secondChannel ? formatCurrency(data.secondChannel.spend) : prev.spendOnSecondChannel,
          secondChannelLeads: data.secondChannel ? formatNumber(data.secondChannel.results) : prev.secondChannelLeads,
          secondChannelCpl: data.secondChannel ? formatCurrency(data.secondChannel.cpr) : prev.secondChannelCpl,
          
          // Top campaigns by leads
          topCampaign1Name: topCampaignsByLeads[0]?.name || prev.topCampaign1Name,
          topCampaign1Leads: topCampaignsByLeads[0] ? formatNumber(topCampaignsByLeads[0].results) : prev.topCampaign1Leads,
          topCampaign1Spend: topCampaignsByLeads[0] ? formatCurrency(topCampaignsByLeads[0].spend) : prev.topCampaign1Spend,
          topCampaign1Cpl: topCampaignsByLeads[0] ? formatCurrency(topCampaignsByLeads[0].cpr) : prev.topCampaign1Cpl,
          topCampaign2Name: topCampaignsByLeads[1]?.name || prev.topCampaign2Name,
          topCampaign2Leads: topCampaignsByLeads[1] ? formatNumber(topCampaignsByLeads[1].results) : prev.topCampaign2Leads,
          topCampaign2Spend: topCampaignsByLeads[1] ? formatCurrency(topCampaignsByLeads[1].spend) : prev.topCampaign2Spend,
          topCampaign2Cpl: topCampaignsByLeads[1] ? formatCurrency(topCampaignsByLeads[1].cpr) : prev.topCampaign2Cpl,
          mostEfficientCampaign: efficientCampaigns[0]?.name || prev.mostEfficientCampaign,
          mostEfficientCampaignCpl: efficientCampaigns[0] ? formatCurrency(efficientCampaigns[0].cpr) : prev.mostEfficientCampaignCpl,
          
          // Efficiency metrics
          averageCpl: formatCurrency(data.averageCpr),
          averageCpm: formatCurrency(data.averageCpm),
          averageCpc: formatCurrency(data.averageCpc),
          averageCtr: data.averageCtr.toFixed(2) + "%",
          bestMonthForEfficiency: data.bestMonthByCpr?.month || prev.bestMonthForEfficiency,
          bestMonthCpl: data.bestMonthByCpr ? formatCurrency(data.bestMonthByCpr.cpr) : prev.bestMonthCpl,
        }));
      }
    },
    // Recompute when currency (and thus formatCurrency/getCurrency) changes
    [formData.currency]
  );

  // If currency is changed after data import, re-run the auto-population
  useEffect(() => {
    if (aggregatedData.channels.length > 0) {
      handleDataChange(aggregatedData);
    }
  }, [formData.currency, aggregatedData, handleDataChange]);

  const updateField = useCallback((field: keyof AdsFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const canGenerate = !!formData.totalAdSpend;

  const periodType = formData.periodType || "year";
  const selectedYear = formData.periodYear || formData.year || new Date().getFullYear().toString();
  const selectedMonth = formData.periodMonth || "";
  const periodLabel = periodType === "month" && selectedMonth ? selectedMonth : selectedYear;

  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  const monthName = (d: Date) =>
    d.toLocaleString(undefined, { month: "long" });

  const computePresetRange = (preset: typeof datePreset) => {
    const now = new Date();
    const y = now.getFullYear();

    if (preset === "this_year") {
      return { startDate: `${y}-01-01`, endDate: `${y}-12-31` };
    }
    if (preset === "last_year") {
      const ly = y - 1;
      return { startDate: `${ly}-01-01`, endDate: `${ly}-12-31` };
    }
    if (preset === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: toISODate(start), endDate: toISODate(end) };
    }
    if (preset === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: toISODate(start), endDate: toISODate(end) };
    }
    return { startDate: customStartDate, endDate: customEndDate };
  };

  const periodFromRange = (preset: typeof datePreset, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if ((preset === "this_year" || preset === "last_year") && startDate.endsWith("-01-01") && endDate.endsWith("-12-31")) {
      return {
        periodType: "year" as const,
        periodYear: start.getFullYear().toString(),
        periodMonth: "",
        periodStartDate: "",
        periodEndDate: "",
        periodLabel: start.getFullYear().toString(),
      };
    }

    if ((preset === "this_month" || preset === "last_month") && start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      const m = monthName(start);
      return {
        periodType: "month" as const,
        periodYear: start.getFullYear().toString(),
        periodMonth: m,
        periodStartDate: "",
        periodEndDate: "",
        periodLabel: m,
      };
    }

    return {
      periodType: "custom" as const,
      periodYear: start.getFullYear().toString(),
      periodMonth: "",
      periodStartDate: startDate,
      periodEndDate: endDate,
      periodLabel: `${startDate} – ${endDate}`,
    };
  };

  const runManualGenerate = async (companyName: string, period: ReturnType<typeof periodFromRange>) => {
    const slideFormData = {
      customerName: companyName,
      periodType: period.periodType,
      periodYear: period.periodYear,
      periodMonth: period.periodMonth,
      periodStartDate: period.periodStartDate,
      periodEndDate: period.periodEndDate,
      currencyCode: formData.currency,
      totalAdSpend: formData.totalAdSpend,
      revenueAttributed: formData.revenueAttributed || "0",
      blendedRoas: formData.blendedRoas || "0x",
      totalConversions: formData.totalConversions,
      totalImpressions: formData.totalImpressions,
      totalClicks: formData.totalClicks,
      topChannelBySpend: formData.topChannelBySpend,
      spendOnTopChannel: formData.spendOnTopChannel,
      topChannelRoas: "0x",
      secondChannel: formData.secondChannel,
      spendOnSecondChannel: formData.spendOnSecondChannel,
      secondChannelRoas: "0x",
      bestRoasChannel: "",
      bestRoasChannelPerformance: "",
      topCampaign1Name: formData.topCampaign1Name,
      topCampaign1Revenue: "0",
      topCampaign1Roas: "0x",
      topCampaign1Spend: formData.topCampaign1Spend,
      topCampaign2Name: formData.topCampaign2Name,
      topCampaign2Revenue: "0",
      mostEfficientCampaign: formData.mostEfficientCampaign,
      mostEfficientCampaignRoas: "0x",
      topCreative1Description: "",
      topCreative1Performance: "",
      topCreative2Description: "",
      topCreative2Performance: "",
      bestPerformingFormat: "",
      bestHookAngle: "",
      totalCreativesTested: "",
      creativeWinRate: "",
      averageCpm: formData.averageCpm,
      averageCpc: formData.averageCpc,
      averageCpa: formData.averageCpl,
      averageCtr: formData.averageCtr,
      bestMonthForEfficiency: formData.bestMonthForEfficiency,
      bestMonthCpa: formData.bestMonthCpl,
      yoyCpaChange: formData.yoyCplChange,
      yoyRoasChange: formData.yoyRoasChange,
    };

    const { buildAdsSlidesFromForm } = await import("../../lib/buildSlidesFromForm");
    const slides = buildAdsSlidesFromForm(slideFormData as any, aggregatedData);

    const res = await fetch("/api/wraps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${companyName}'s ${period.periodLabel} Wrapped`,
        wrap_type: "ads",
        year: parseInt(period.periodYear) || new Date().getFullYear(),
        form_data: slideFormData,
        slides_data: slides,
      }),
    });

    const data = await res.json();
    if (res.ok && data.shareUrl) router.push(data.shareUrl);
  };

  const handleGenerate = async () => {
    setPendingPlatforms(null);
    setGenerateCompanyName(formData.customerName || "");
    setDatePreset("this_year");
    const { startDate, endDate } = computePresetRange("this_year");
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setShowGeneratePrompt(true);
  };

  // Input field component
  const Field = ({ label, field, placeholder, help }: { label: string; field: keyof AdsFormData; placeholder: string; help?: string }) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type="text"
        value={formData[field]}
        onChange={(e) => updateField(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white placeholder:text-slate-500 focus:border-orange-400 focus:outline-none"
      />
      {help && <div className="text-[10px] text-slate-500 mt-1">{help}</div>}
    </div>
  );

  return (
    <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-[0_40px_120px_rgba(0,0,0,0.9)] overflow-hidden">
      {showGeneratePrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Generate Wrapped</h3>
            <p className="text-sm text-slate-400 mb-4">Choose a company and date range to pull.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Company Name</label>
                <input
                  type="text"
                  value={generateCompanyName}
                  onChange={(e) => setGenerateCompanyName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Date Range</label>
                <select
                  value={datePreset}
                  onChange={(e) => {
                    const preset = e.target.value as any;
                    setDatePreset(preset);
                    const r = computePresetRange(preset);
                    setCustomStartDate(r.startDate);
                    setCustomEndDate(r.endDate);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                >
                  <option value="this_year">This year</option>
                  <option value="last_year">Last year</option>
                  <option value="this_month">This month</option>
                  <option value="last_month">Last month</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {datePreset === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Start</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">End</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGeneratePrompt(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const company = generateCompanyName.trim();
                  if (!company) return;

                  const { startDate, endDate } = computePresetRange(datePreset);
                  if (!startDate || !endDate) return;

                  const period = periodFromRange(datePreset, startDate, endDate);

                  setFormData((prev) => ({
                    ...prev,
                    customerName: company,
                    year: period.periodYear,
                    periodType: period.periodType,
                    periodYear: period.periodYear,
                    periodMonth: period.periodMonth,
                  }));

                  setShowGeneratePrompt(false);
                  setIsGenerating(true);

                  try {
                    if (!pendingPlatforms) {
                      await runManualGenerate(company, period);
                      return;
                    }

                    // Automatic: pull from Snowflake for selected period
                    const snowflakeRes = await fetch("/api/snowflake/ads-data", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: adsUserId,
                        platforms: pendingPlatforms,
                        year: parseInt(period.periodYear) || new Date().getFullYear(),
                        companyName: company,
                        startDate,
                        endDate,
                      }),
                    });

                    const snowflakeData = await snowflakeRes.json();
                    if (!snowflakeRes.ok || !snowflakeData.success) {
                      throw new Error(snowflakeData.error || "Failed to fetch ads data from Snowflake");
                    }

                    const sfData = snowflakeData.data;

                    // We reuse existing auto-generation path by writing the period fields and calling the existing logic:
                    // (The existing auto generator runs inside onGenerateWrapped; here we run a manual equivalent save.)
                    const { buildAdsSlidesFromForm } = await import("../../lib/buildSlidesFromForm");
                    const slideFormData = {
                      customerName: company,
                      periodType: period.periodType,
                      periodYear: period.periodYear,
                      periodMonth: period.periodMonth,
                      periodStartDate: period.periodStartDate,
                      periodEndDate: period.periodEndDate,
                      currencyCode: (sfData?.byPlatform?.google_ads?.currencyCode || sfData.currencyCode || formData.currency),
                      totalAdSpend: (sfData.totalSpend || 0).toString(),
                      revenueAttributed: (sfData.totalRevenue || 0).toString(),
                      blendedRoas: (sfData.blendedRoas || 0).toString(),
                      totalConversions: (sfData.totalConversions || 0).toString(),
                      totalImpressions: (sfData.totalImpressions || 0).toString(),
                      totalClicks: (sfData.totalClicks || 0).toString(),
                      topChannelBySpend: "",
                      spendOnTopChannel: "",
                      topChannelRoas: "0x",
                      secondChannel: "",
                      spendOnSecondChannel: "",
                      secondChannelRoas: "0x",
                      bestRoasChannel: "",
                      bestRoasChannelPerformance: "",
                      topCampaign1Name: "",
                      topCampaign1Revenue: "0",
                      topCampaign1Roas: "0x",
                      topCampaign1Spend: "0",
                      topCampaign2Name: "",
                      topCampaign2Revenue: "0",
                      mostEfficientCampaign: "",
                      mostEfficientCampaignRoas: "0x",
                      topCreative1Description: "",
                      topCreative1Performance: "",
                      topCreative2Description: "",
                      topCreative2Performance: "",
                      bestPerformingFormat: "",
                      bestHookAngle: "",
                      totalCreativesTested: "",
                      creativeWinRate: "",
                      averageCpm: "0",
                      averageCpc: "0",
                      averageCpa: "0",
                      averageCtr: "0",
                      bestMonthForEfficiency: "",
                      bestMonthCpa: "",
                      yoyCpaChange: "",
                      yoyRoasChange: "",
                    };

                    const slides = buildAdsSlidesFromForm(slideFormData as any, sfData);
                    const res = await fetch("/api/wraps", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: `${company}'s ${period.periodLabel} Wrapped`,
                        wrap_type: "ads",
                        year: parseInt(period.periodYear) || new Date().getFullYear(),
                        form_data: slideFormData,
                        slides_data: slides,
                      }),
                    });

                    const data = await res.json();
                    if (res.ok && data.shareUrl) router.push(data.shareUrl);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={!generateCompanyName.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="border-b border-white/10 px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Ads Wrapped Dashboard</h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
              Import your ad data or enter metrics manually. All fields are editable.
            </p>
          </div>
          {formData.totalConversions && (
            <div className="text-right">
              <div className="text-2xl font-bold text-cyan-400">{formData.totalConversions}</div>
              <div className="text-xs text-slate-400">Total Results</div>
            </div>
          )}
        </div>
      </div>

      {/* Import Mode Toggle */}
      <div className="px-6 md:px-8 py-3 border-b border-white/10 flex gap-3">
        <button
          onClick={() => setImportMode("manual")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            importMode === "manual"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Manual Import
        </button>
        <button
          onClick={() => setImportMode("automatic")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            importMode === "automatic"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Automatic Import
        </button>
      </div>

      {/* Section Tabs - Only show for Manual Import */}
      {importMode === "manual" && (
      <div className="px-6 md:px-8 pt-4 pb-2 border-b border-white/5 flex gap-2">
        <button
          onClick={() => setActiveSection("import")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeSection === "import"
              ? "bg-white text-slate-900"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          1. Import Data
        </button>
        <button
          onClick={() => setActiveSection("edit")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeSection === "edit"
              ? "bg-white text-slate-900"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          2. Edit All Fields
        </button>
      </div>
      )}

      {/* Content - Manual Import */}
      {importMode === "manual" && (
      <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto">
        {activeSection === "import" && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dedicated Customer / Brand Name field */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Customer / Brand Name *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => updateField("customerName", e.target.value)}
                  placeholder="Acme Inc"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white placeholder:text-slate-500 focus:border-orange-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-orange-400 focus:outline-none"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Period</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={periodType}
                    onChange={(e) => updateField("periodType", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-orange-400 focus:outline-none"
                  >
                    <option value="year">Year</option>
                    <option value="month">Month</option>
                  </select>
                  {periodType === "year" ? (
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        updateField("periodYear", e.target.value);
                        updateField("year", e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-orange-400 focus:outline-none"
                    >
                      {Array.from({ length: 6 }).map((_, idx) => {
                        const y = (new Date().getFullYear() - idx).toString();
                        return (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <select
                      value={selectedMonth}
                      onChange={(e) => updateField("periodMonth", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-orange-400 focus:outline-none"
                    >
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Data Manager */}
            <AdsDataManager
              onDataChange={handleDataChange}
              currencySymbol={getCurrency().symbol}
            />
            
            {/* Manual Revenue Entry */}
            {aggregatedData.channels.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30">
                <h3 className="text-sm font-medium text-amber-300 mb-3">Revenue & ROAS (Manual Entry)</h3>
                <p className="text-xs text-slate-400 mb-3">Revenue is not captured in ad platform exports. Enter manually if you want ROAS calculations.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Revenue Attributed to Ads"
                    field="revenueAttributed"
                    placeholder={`${getCurrency().symbol}500,000`}
                    help="Optional - leave blank if unknown"
                  />
                  <Field
                    label="Blended ROAS"
                    field="blendedRoas"
                    placeholder="3.2x"
                    help="Optional - will calculate if revenue provided"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "edit" && (
          <div className="space-y-8">
            {/* Overview */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Performance Overview</h3>
              <p className="text-xs text-slate-400 mb-4">High-level metrics from your ad campaigns.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field
                  label="Total Ad Spend *"
                  field="totalAdSpend"
                  placeholder={`${getCurrency().symbol}233,000`}
                />
                <Field label="Total Results" field="totalConversions" placeholder="36,387" />
                <Field label="Total Impressions" field="totalImpressions" placeholder="23,171,077" />
                <Field label="Total Clicks" field="totalClicks" placeholder="156,629" />
              </div>
            </div>

            {/* Revenue (Optional) */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Revenue & ROAS (Optional)</h3>
              <p className="text-xs text-slate-400 mb-4">Enter if you track revenue attribution. Leave blank for lead-gen focused wraps.</p>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <Field
                  label="Revenue Attributed to Ads"
                  field="revenueAttributed"
                  placeholder={`${getCurrency().symbol}500,000`}
                />
                <Field label="Blended ROAS" field="blendedRoas" placeholder="3.2x" />
              </div>
            </div>

            {/* Channel Breakdown */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Channel Breakdown</h3>
              <p className="text-xs text-slate-400 mb-4">Performance by ad platform.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Top Channel by Spend" field="topChannelBySpend" placeholder="Meta Ads" />
                <Field
                  label="Spend on Top Channel"
                  field="spendOnTopChannel"
                  placeholder={`${getCurrency().symbol}180,000`}
                />
                <Field label="Top Channel Results" field="topChannelLeads" placeholder="28,000" />
                <Field
                  label="Top Channel CPR (Cost per Result)"
                  field="topChannelCpl"
                  placeholder={`${getCurrency().symbol}6.43`}
                />
                <Field label="Second Channel" field="secondChannel" placeholder="Google Ads" />
                <Field
                  label="Spend on Second Channel"
                  field="spendOnSecondChannel"
                  placeholder={`${getCurrency().symbol}53,000`}
                />
                <Field label="Second Channel Results" field="secondChannelLeads" placeholder="8,387" />
                <Field
                  label="Second Channel CPR"
                  field="secondChannelCpl"
                  placeholder={`${getCurrency().symbol}6.32`}
                />
              </div>
            </div>

            {/* Top Campaigns */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Top Campaigns</h3>
              <p className="text-xs text-slate-400 mb-4">Your best-performing campaigns by lead volume and efficiency.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field
                  label="Top Campaign #1 Name"
                  field="topCampaign1Name"
                  placeholder="Summer Sale - Prospecting"
                />
                <Field label="Top Campaign #1 Results" field="topCampaign1Leads" placeholder="12,500" />
                <Field
                  label="Top Campaign #1 Spend"
                  field="topCampaign1Spend"
                  placeholder={`${getCurrency().symbol}45,000`}
                />
                <Field
                  label="Top Campaign #1 CPR"
                  field="topCampaign1Cpl"
                  placeholder={`${getCurrency().symbol}3.60`}
                />
                <Field
                  label="Top Campaign #2 Name"
                  field="topCampaign2Name"
                  placeholder="Retargeting - Cart Abandoners"
                />
                <Field label="Top Campaign #2 Results" field="topCampaign2Leads" placeholder="8,200" />
                <Field
                  label="Top Campaign #2 Spend"
                  field="topCampaign2Spend"
                  placeholder={`${getCurrency().symbol}28,000`}
                />
                <Field
                  label="Top Campaign #2 CPR"
                  field="topCampaign2Cpl"
                  placeholder={`${getCurrency().symbol}3.41`}
                />
                <Field label="Most Efficient Campaign" field="mostEfficientCampaign" placeholder="Brand Awareness" />
                <Field
                  label="Most Efficient CPR"
                  field="mostEfficientCampaignCpl"
                  placeholder={`${getCurrency().symbol}1.20`}
                />
              </div>
            </div>

            {/* Efficiency Metrics */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Efficiency Metrics</h3>
              <p className="text-xs text-slate-400 mb-4">CPR, CPM, CPC, and other efficiency indicators.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field
                  label="Average CPR"
                  field="averageCpl"
                  placeholder={`${getCurrency().symbol}6.40`}
                  help="Cost per result"
                />
                <Field
                  label="Average CPM"
                  field="averageCpm"
                  placeholder={`${getCurrency().symbol}10.06`}
                  help="Cost per 1,000 impressions"
                />
                <Field
                  label="Average CPC"
                  field="averageCpc"
                  placeholder={`${getCurrency().symbol}1.49`}
                  help="Cost per click"
                />
                <Field label="Average CTR" field="averageCtr" placeholder="0.68%" help="Click-through rate" />
                <Field label="Best Month for Efficiency" field="bestMonthForEfficiency" placeholder="September" />
                <Field
                  label="Best Month CPR"
                  field="bestMonthCpl"
                  placeholder={`${getCurrency().symbol}4.80`}
                />
              </div>
            </div>

            {/* YoY Changes */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Year-over-Year Changes</h3>
              <p className="text-xs text-slate-400 mb-4">How your metrics changed compared to last year.</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="YoY CPR Change" field="yoyCplChange" placeholder="-18%" />
                <Field label="YoY ROAS Change" field="yoyRoasChange" placeholder="+22%" />
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Automatic Import - Fivetran Integration */}
      {importMode === "automatic" && (
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Connect Your Ad Platforms</h3>
            <p className="text-sm text-slate-400">
              Securely connect your ad accounts to automatically import your campaign data.
              Your credentials are handled directly by each platform - we never see them.
            </p>
          </div>
          
          {/* Fivetran Connector Component */}
          <FivetranConnector
            userId={adsUserId}
            wrapType="ads"
            onConnectionComplete={(connection) => {
              console.log("Connection completed:", connection);
            }}
            onGenerateWrapped={async (connectedServices, clientCompanyName) => {
              console.log("Generate Wrapped clicked with services:", connectedServices, "for company:", clientCompanyName);

              // Open the same Generate modal used by manual generation,
              // but with the connected platform list prefilled.
              setPendingPlatforms(connectedServices);
              setGenerateCompanyName(clientCompanyName || formData.customerName || "");
              setDatePreset("this_year");
              const { startDate, endDate } = computePresetRange("this_year");
              setCustomStartDate(startDate);
              setCustomEndDate(endDate);
              setShowGeneratePrompt(true);
              return;
            }}
          />

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-500 mb-4">
              Data will sync automatically once connected. First sync may take a few minutes.
            </p>
            <button
              onClick={() => setImportMode("manual")}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition"
            >
              ← Use Manual Import Instead
            </button>
          </div>
        </div>
      )}

      {/* Footer - Only show for Manual Import */}
      {importMode === "manual" && (
      <div className="border-t border-white/10 px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          {aggregatedData.channels.length > 0 
            ? `${aggregatedData.channels.length} channel(s) imported • ${aggregatedData.topCampaignsByRevenue.length} campaigns detected`
            : "Enter data manually or import from ad platforms"
          }
        </div>
        <div className="flex gap-3">
          {activeSection === "edit" && (
            <button
              onClick={() => setActiveSection("import")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              ← Back
            </button>
          )}
          {activeSection === "import" && (
            <button
              onClick={() => setActiveSection("edit")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              Edit All Fields →
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
              canGenerate && !isGenerating
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              "Generate Wrapped"
            )}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
