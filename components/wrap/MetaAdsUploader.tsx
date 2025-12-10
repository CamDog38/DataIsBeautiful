"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";

// Field configuration with aggregation type
type AggregationType = "sum" | "average" | "first" | "topCampaigns";

interface FieldConfig {
  possibleHeaders: string[];
  aggregation: AggregationType;
  label: string;
}

// Meta Ads column mappings - maps various Meta export header names to our form fields
const META_COLUMN_MAPPINGS: Record<string, FieldConfig> = {
  // Overview metrics (SUM)
  totalAdSpend: {
    possibleHeaders: [
      "Amount spent (USD)", "Amount spent", "Spend", "Total spend", "Cost", 
      "Amount Spent", "amount_spent", "spend"
    ],
    aggregation: "sum",
    label: "Total Ad Spend",
  },
  revenueAttributed: {
    possibleHeaders: [
      "Purchase conversion value", "Conversion value", "Revenue", "Total revenue",
      "Website purchase conversion value", "Purchase ROAS", "purchase_roas",
      "Purchases conversion value", "website_purchase_roas", "Total conversion value"
    ],
    aggregation: "sum",
    label: "Revenue Attributed",
  },
  blendedRoas: {
    possibleHeaders: [
      "ROAS (return on ad spend)", "ROAS", "Return on ad spend", "Purchase ROAS",
      "Website purchase ROAS", "roas", "purchase_roas"
    ],
    aggregation: "average",
    label: "Blended ROAS",
  },
  totalConversions: {
    possibleHeaders: [
      "Purchases", "Conversions", "Total conversions", "Results", 
      "Website purchases", "purchases", "conversions", "Actions"
    ],
    aggregation: "sum",
    label: "Total Conversions",
  },
  totalImpressions: {
    possibleHeaders: [
      "Impressions", "Total impressions", "impressions", "Reach"
    ],
    aggregation: "sum",
    label: "Total Impressions",
  },
  totalClicks: {
    possibleHeaders: [
      "Clicks (all)", "Link clicks", "Clicks", "Total clicks", "clicks",
      "Outbound clicks"
    ],
    aggregation: "sum",
    label: "Total Clicks",
  },
  
  // Efficiency metrics - CPM is sum of impressions-based cost, others are averages
  // Note: Field names match the AdsFormData in EcommerceDashboard
  averageCpm: {
    possibleHeaders: [
      "CPM (cost per 1,000 impressions)", "CPM", "Cost per 1,000 impressions",
      "cpm", "Cost per mille", "Impressions"
    ],
    aggregation: "sum",
    label: "Total CPM (Impressions)",
  },
  averageCpc: {
    possibleHeaders: [
      "CPC (cost per link click)", "CPC (all)", "CPC", "Cost per click",
      "Cost per link click", "cpc"
    ],
    aggregation: "average",
    label: "Average CPC",
  },
  averageCpa: {
    possibleHeaders: [
      "Cost per result", "Cost per purchase", "Cost per conversion",
      "Cost per action", "cost_per_result", "cost_per_purchase"
    ],
    aggregation: "average",
    label: "Average Cost per Result",
  },
  averageCtr: {
    possibleHeaders: [
      "CTR (all)", "CTR (link click-through rate)", "CTR", "Click-through rate",
      "Link CTR", "ctr"
    ],
    aggregation: "average",
    label: "Average CTR",
  },
  
  // Campaign info - special handling for top campaigns
  topCampaign1Name: {
    possibleHeaders: [
      "Campaign name", "Campaign", "campaign_name"
    ],
    aggregation: "topCampaigns",
    label: "Top Campaign",
  },
};

// Comparison period mappings (for YoY changes)
const COMPARISON_MAPPINGS: Record<string, FieldConfig> = {
  yoyCpaChange: {
    possibleHeaders: [
      "Cost per purchase % change", "CPA % change", "Cost per result % change"
    ],
    aggregation: "average",
    label: "YoY CPA Change",
  },
  yoyRoasChange: {
    possibleHeaders: [
      "ROAS % change", "Purchase ROAS % change", "Return on ad spend % change"
    ],
    aggregation: "average",
    label: "YoY ROAS Change",
  },
};

interface CampaignPerformance {
  name: string;
  spend: number;
  revenue: number;
  roas: number;
  conversions: number;
}

interface FieldMapping {
  header: string;
  value: string;
  confidence: number;
  aggregation: AggregationType;
  label: string;
  // For topCampaigns, store the options
  campaignOptions?: CampaignPerformance[];
  selectedCampaign?: string;
}

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  mappings: Record<string, FieldMapping>;
  hasComparison: boolean;
}

interface MetaAdsUploaderProps {
  onDataParsed: (data: Record<string, string>) => void;
  onClose: () => void;
}

export function MetaAdsUploader({ onDataParsed, onClose }: MetaAdsUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) throw new Error("File must have at least a header row and one data row");

    // Parse CSV properly handling quoted fields
    const parseRow = (row: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map(line => {
      const values = parseRow(line);
      const row: Record<string, string> = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || "";
      });
      return row;
    });

    return { headers, rows };
  };

  const parseExcel = async (file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> => {
    // Dynamically import xlsx library
    const XLSX = await import("xlsx");
    
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (jsonData.length < 2) throw new Error("File must have at least a header row and one data row");

    const headers = (jsonData[0] as any[]).map(h => String(h || "").trim());
    const rows = jsonData.slice(1).map((row: any[]) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = String(row[i] ?? "").trim();
      });
      return obj;
    });

    return { headers, rows };
  };

  const findBestMatch = (headers: string[], possibleNames: string[]): { header: string; confidence: number } | null => {
    for (const name of possibleNames) {
      // Exact match (case-insensitive)
      const exactMatch = headers.find(h => h.toLowerCase() === name.toLowerCase());
      if (exactMatch) return { header: exactMatch, confidence: 1 };
    }

    for (const name of possibleNames) {
      // Contains match
      const containsMatch = headers.find(h => 
        h.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(h.toLowerCase())
      );
      if (containsMatch) return { header: containsMatch, confidence: 0.8 };
    }

    return null;
  };

  const aggregateValues = (
    rows: Record<string, string>[], 
    header: string, 
    aggregation: AggregationType
  ): string => {
    let sum = 0;
    let count = 0;
    let firstValue = "";

    for (const row of rows) {
      const val = row[header] || "";
      if (!firstValue && val) firstValue = val;

      // Try to parse as number (remove currency symbols, commas, %)
      const cleaned = val.replace(/[$€£¥,\s%]/g, "");
      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        sum += num;
        count++;
      }
    }

    if (count === 0) return firstValue;

    // Calculate result based on aggregation type
    let result: number;
    if (aggregation === "average" && count > 0) {
      result = sum / count;
    } else if (aggregation === "first") {
      return firstValue;
    } else {
      result = sum;
    }

    // Format based on the original value format
    const sample = firstValue;
    if (sample.includes("%")) {
      return result.toFixed(2) + "%";
    } else if (sample.match(/^[$€£¥]/)) {
      const symbol = sample.match(/^[$€£¥]/)?.[0] || "$";
      return symbol + result.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else if (sample.includes(".")) {
      return result.toFixed(2);
    }
    return result.toLocaleString();
  };

  // Extract top campaigns by performance
  const extractTopCampaigns = (
    rows: Record<string, string>[],
    campaignHeader: string,
    headers: string[]
  ): CampaignPerformance[] => {
    // Find spend, revenue, conversions headers
    const spendMatch = findBestMatch(headers, META_COLUMN_MAPPINGS.totalAdSpend.possibleHeaders);
    const revenueMatch = findBestMatch(headers, META_COLUMN_MAPPINGS.revenueAttributed.possibleHeaders);
    const conversionsMatch = findBestMatch(headers, META_COLUMN_MAPPINGS.totalConversions.possibleHeaders);

    // Group by campaign
    const campaignMap = new Map<string, { spend: number; revenue: number; conversions: number }>();

    for (const row of rows) {
      const campaignName = row[campaignHeader]?.trim();
      if (!campaignName) continue;

      const existing = campaignMap.get(campaignName) || { spend: 0, revenue: 0, conversions: 0 };

      if (spendMatch) {
        const val = parseFloat((row[spendMatch.header] || "0").replace(/[$€£¥,\s]/g, "")) || 0;
        existing.spend += val;
      }
      if (revenueMatch) {
        const val = parseFloat((row[revenueMatch.header] || "0").replace(/[$€£¥,\s]/g, "")) || 0;
        existing.revenue += val;
      }
      if (conversionsMatch) {
        const val = parseFloat((row[conversionsMatch.header] || "0").replace(/[$€£¥,\s]/g, "")) || 0;
        existing.conversions += val;
      }

      campaignMap.set(campaignName, existing);
    }

    // Convert to array and calculate ROAS
    const campaigns: CampaignPerformance[] = [];
    campaignMap.forEach((data, name) => {
      campaigns.push({
        name,
        spend: data.spend,
        revenue: data.revenue,
        roas: data.spend > 0 ? data.revenue / data.spend : 0,
        conversions: data.conversions,
      });
    });

    // Sort by revenue (best performing first)
    campaigns.sort((a, b) => b.revenue - a.revenue);

    return campaigns.slice(0, 10); // Top 10
  };

  const calculateRoas = (revenue: string, spend: string): string => {
    const rev = parseFloat(revenue.replace(/[$€£¥,\s]/g, "")) || 0;
    const sp = parseFloat(spend.replace(/[$€£¥,\s]/g, "")) || 0;
    if (sp === 0) return "";
    return (rev / sp).toFixed(2) + "x";
  };

  const mapDataToForm = (headers: string[], rows: Record<string, string>[]): ParsedData => {
    const mappings: Record<string, FieldMapping> = {};
    
    // Check if this is a comparison export
    const hasComparison = headers.some(h => 
      h.toLowerCase().includes("% change") || 
      h.toLowerCase().includes("comparison")
    );

    // Map standard fields
    for (const [formField, config] of Object.entries(META_COLUMN_MAPPINGS)) {
      const match = findBestMatch(headers, config.possibleHeaders);
      if (match) {
        if (config.aggregation === "topCampaigns") {
          // Special handling for campaigns
          const campaigns = extractTopCampaigns(rows, match.header, headers);
          if (campaigns.length > 0) {
            mappings[formField] = {
              header: match.header,
              value: campaigns[0].name,
              confidence: match.confidence,
              aggregation: config.aggregation,
              label: config.label,
              campaignOptions: campaigns,
              selectedCampaign: campaigns[0].name,
            };
          }
        } else {
          const value = aggregateValues(rows, match.header, config.aggregation);
          if (value) {
            mappings[formField] = {
              header: match.header,
              value,
              confidence: match.confidence,
              aggregation: config.aggregation,
              label: config.label,
            };
          }
        }
      }
    }

    // Map comparison fields if present
    if (hasComparison) {
      for (const [formField, config] of Object.entries(COMPARISON_MAPPINGS)) {
        const match = findBestMatch(headers, config.possibleHeaders);
        if (match) {
          const value = aggregateValues(rows, match.header, config.aggregation);
          if (value) {
            mappings[formField] = {
              header: match.header,
              value,
              confidence: match.confidence,
              aggregation: config.aggregation,
              label: config.label,
            };
          }
        }
      }
    }

    // Calculate ROAS if we have revenue and spend but no ROAS
    if (!mappings.blendedRoas && mappings.revenueAttributed && mappings.totalAdSpend) {
      const roas = calculateRoas(mappings.revenueAttributed.value, mappings.totalAdSpend.value);
      if (roas) {
        mappings.blendedRoas = {
          header: "(calculated)",
          value: roas,
          confidence: 0.9,
          aggregation: "average",
          label: "Blended ROAS",
        };
      }
    }

    return { headers, rows, mappings, hasComparison };
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    setError(null);
    setParsedData(null);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let data: { headers: string[]; rows: Record<string, string>[] };

      if (ext === "csv") {
        const text = await file.text();
        data = parseCSV(text);
      } else if (ext === "xlsx" || ext === "xls") {
        data = await parseExcel(file);
      } else {
        throw new Error("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      }

      if (data.rows.length === 0) {
        throw new Error("No data rows found in the file");
      }

      const parsed = mapDataToForm(data.headers, data.rows);
      
      if (Object.keys(parsed.mappings).length === 0) {
        throw new Error("Could not find any recognizable Meta Ads columns. Please ensure you're uploading a Meta Ads Performance & Clicks export.");
      }

      setParsedData(parsed);
    } catch (err: any) {
      setError(err.message || "Failed to parse file");
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const applyMappings = () => {
    if (!parsedData) return;
    
    const formData: Record<string, string> = {};
    for (const [field, mapping] of Object.entries(parsedData.mappings)) {
      // For campaigns, use the selected campaign
      if (mapping.aggregation === "topCampaigns" && mapping.selectedCampaign) {
        formData[field] = mapping.selectedCampaign;
      } else {
        formData[field] = mapping.value;
      }
    }
    
    onDataParsed(formData);
    onClose();
  };

  // Update the source column for a field
  const updateSourceColumn = (field: string, newHeader: string) => {
    if (!parsedData) return;
    
    const config = META_COLUMN_MAPPINGS[field] || COMPARISON_MAPPINGS[field];
    if (!config) return;

    const newValue = aggregateValues(parsedData.rows, newHeader, config.aggregation);
    
    setParsedData({
      ...parsedData,
      mappings: {
        ...parsedData.mappings,
        [field]: {
          ...parsedData.mappings[field],
          header: newHeader,
          value: newValue,
          confidence: 1, // User selected, so full confidence
        },
      },
    });
  };

  // Update selected campaign
  const updateSelectedCampaign = (field: string, campaignName: string) => {
    if (!parsedData) return;
    
    setParsedData({
      ...parsedData,
      mappings: {
        ...parsedData.mappings,
        [field]: {
          ...parsedData.mappings[field],
          value: campaignName,
          selectedCampaign: campaignName,
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Import Meta Ads Data</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload your Meta Ads Performance & Clicks export (CSV or Excel)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!parsedData ? (
            <>
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-orange-400 bg-orange-500/10"
                    : "border-white/20 hover:border-white/40 hover:bg-white/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
                
                {parsing ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-400"></div>
                    <p className="text-slate-300">Parsing file...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-white font-medium mb-1">
                      Drop your Meta Ads export here
                    </p>
                    <p className="text-sm text-slate-400">
                      or click to browse • CSV, XLSX, XLS
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Instructions */}
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium text-white">How to export from Meta Ads Manager:</h3>
                <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
                  <li>Go to Meta Ads Manager → Campaigns</li>
                  <li>Select your date range (e.g., full year)</li>
                  <li>Click "Reports" → "Export Table Data"</li>
                  <li>Choose "Performance and clicks" preset</li>
                  <li>For YoY comparison, enable "Compare" with previous period</li>
                  <li>Export as CSV or Excel</li>
                </ol>
              </div>
            </>
          ) : (
            <>
              {/* Parsed data preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-white">
                    Found {Object.keys(parsedData.mappings).length} fields from {parsedData.rows.length} row(s)
                  </span>
                  {parsedData.hasComparison && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                      With comparison data
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto rounded-lg border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-slate-400 font-medium">Field</th>
                        <th className="text-left px-3 py-2 text-slate-400 font-medium">Source Column</th>
                        <th className="text-left px-3 py-2 text-slate-400 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.entries(parsedData.mappings).map(([field, mapping]) => (
                        <tr key={field} className="hover:bg-white/5">
                          <td className="px-3 py-2 text-white whitespace-nowrap">
                            {mapping.label}
                            {mapping.aggregation === "average" && (
                              <span className="ml-1 text-[10px] text-slate-500">(avg)</span>
                            )}
                            {mapping.aggregation === "sum" && (
                              <span className="ml-1 text-[10px] text-slate-500">(sum)</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {/* Dropdown to select source column */}
                            <select
                              value={mapping.header}
                              onChange={(e) => updateSourceColumn(field, e.target.value)}
                              className="bg-slate-800 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 max-w-[180px] truncate cursor-pointer hover:border-white/30 focus:outline-none focus:border-orange-400"
                            >
                              <option value={mapping.header}>{mapping.header}</option>
                              {parsedData.headers
                                .filter(h => h !== mapping.header)
                                .map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))
                              }
                            </select>
                            {mapping.confidence < 1 && (
                              <span className="ml-1 text-yellow-500 text-xs" title="Fuzzy match">~</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {/* For campaigns, show a dropdown of top performers */}
                            {mapping.aggregation === "topCampaigns" && mapping.campaignOptions ? (
                              <div className="space-y-1">
                                <select
                                  value={mapping.selectedCampaign || ""}
                                  onChange={(e) => updateSelectedCampaign(field, e.target.value)}
                                  className="bg-slate-800 border border-white/10 rounded px-2 py-1 text-xs text-orange-400 max-w-[200px] cursor-pointer hover:border-white/30 focus:outline-none focus:border-orange-400"
                                >
                                  {mapping.campaignOptions.map((campaign, idx) => (
                                    <option key={campaign.name} value={campaign.name}>
                                      #{idx + 1}: {campaign.name.slice(0, 30)}{campaign.name.length > 30 ? "..." : ""}
                                    </option>
                                  ))}
                                </select>
                                {/* Show campaign stats */}
                                {mapping.campaignOptions.find(c => c.name === mapping.selectedCampaign) && (
                                  <div className="text-[10px] text-slate-500">
                                    {(() => {
                                      const c = mapping.campaignOptions!.find(c => c.name === mapping.selectedCampaign)!;
                                      return `Revenue: $${c.revenue.toLocaleString()} • ROAS: ${c.roas.toFixed(2)}x • Conv: ${c.conversions}`;
                                    })()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-orange-400 font-mono">{mapping.value}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Unmapped headers info */}
                <details className="text-xs">
                  <summary className="text-slate-500 cursor-pointer hover:text-slate-400">
                    View all {parsedData.headers.length} columns in file
                  </summary>
                  <div className="mt-2 p-2 rounded bg-slate-800/50 text-slate-400 max-h-32 overflow-y-auto">
                    {parsedData.headers.join(", ")}
                  </div>
                </details>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
          >
            Cancel
          </button>
          {parsedData && (
            <>
              <button
                onClick={() => setParsedData(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                Upload Different File
              </button>
              <button
                onClick={applyMappings}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition"
              >
                Apply {Object.keys(parsedData.mappings).length} Fields
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
