"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  AdChannel,
  ChannelData,
  CampaignData,
  DailyMetrics,
  ResultsByType,
  ResultType,
  calculateRoas,
  calculateCpr,
  calculateCpm,
  calculateCpc,
  calculateCtr,
  parseResultType,
  getResultTypeName,
} from "../../lib/adsDataTypes";

// Column mappings for different platforms
const COLUMN_MAPPINGS: Record<AdChannel, Record<string, string[]>> = {
  meta: {
    date: ["Day", "Date", "Reporting starts", "date"],
    campaignName: ["Campaign name", "Campaign", "campaign_name"],
    adName: ["Ad name", "Ad", "ad_name"],
    adFormat: ["Ad format", "Format", "Placement"],
    spend: ["Amount spent (USD)", "Amount spent", "Spend", "Cost", "amount_spent"],
    revenue: ["Purchase conversion value", "Conversion value", "Revenue", "Purchases conversion value"],
    // Results columns - Meta uses "Result Type" + "Results" columns
    resultType: ["Result Type", "Result type", "result_type", "Objective"],
    results: ["Results", "results", "Result"],
    resultValue: ["Result value", "Results ROAS", "Result Value", "result_value"],
    conversions: ["Purchases", "Conversions", "purchases", "conversions"],
    impressions: ["Impressions", "impressions"],
    clicks: ["Clicks (all)", "Link clicks", "Clicks", "clicks"],
    ctr: ["CTR (all)", "CTR", "ctr"],
    cpc: ["CPC (cost per link click)", "CPC (all)", "CPC", "cpc"],
    cpm: ["CPM (cost per 1,000 impressions)", "CPM", "cpm"],
    costPerResult: ["Cost per result", "Cost per purchase", "cost_per_result"],
  },
  google: {
    date: ["Day", "Date", "date", "Week", "Month"],
    campaignName: ["Campaign", "Campaign name", "campaign"],
    adName: ["Ad", "Ad name", "Headline"],
    adFormat: ["Ad type", "Format", "Campaign type", "Campaign state"],
    spend: ["Cost", "Spend", "Amount spent", "cost", "Cost (account currency)"],
    revenue: ["Conv. value", "Conversion value", "Revenue", "All conv. value", "Conversion value (account currency)", "View-through conv."],
    resultType: ["Conversion action", "Goal"],
    results: ["Conversions", "Conv.", "All conv.", "conversions"],
    resultValue: ["Conv. value", "All conv. value", "View-through conv."],
    conversions: ["Conversions", "Conv.", "All conv.", "conversions"],
    impressions: ["Impr.", "Impressions", "impressions"],
    clicks: ["Clicks", "clicks"],
    ctr: ["CTR", "Click-through rate", "ctr"],
    cpc: ["Avg. CPC", "CPC", "Cost / click", "cpc", "Avg. CPC (account currency)"],
    cpm: ["Avg. CPM", "CPM", "cpm"],
    costPerResult: ["Cost / conv.", "Cost per conversion", "CPA", "Cost / conv. (account currency)", "Conv. rate"],
  },
  tiktok: {
    date: ["Date", "Day"],
    campaignName: ["Campaign name", "Campaign"],
    adName: ["Ad name", "Ad"],
    adFormat: ["Ad format"],
    spend: ["Cost", "Spend", "Total cost"],
    revenue: ["Total purchase value", "Conversion value"],
    conversions: ["Conversions", "Complete payment", "Results"],
    impressions: ["Impressions"],
    clicks: ["Clicks"],
    ctr: ["CTR"],
    cpc: ["CPC"],
    cpm: ["CPM"],
    costPerResult: ["Cost per result", "CPA"],
  },
  linkedin: {
    date: ["Start Date", "Date"],
    campaignName: ["Campaign Name", "Campaign"],
    adName: ["Ad Name", "Creative"],
    adFormat: ["Ad Format"],
    spend: ["Total Spent", "Cost", "Spend"],
    revenue: ["Conversion Value"],
    conversions: ["Conversions", "Leads"],
    impressions: ["Impressions"],
    clicks: ["Clicks"],
    ctr: ["CTR"],
    cpc: ["Avg. CPC", "CPC"],
    cpm: ["Avg. CPM", "CPM"],
    costPerResult: ["Cost per Lead", "Cost per Conversion"],
  },
  other: {
    date: ["Date", "Day"],
    campaignName: ["Campaign", "Campaign name"],
    adName: ["Ad", "Ad name"],
    adFormat: ["Format"],
    spend: ["Spend", "Cost", "Amount"],
    revenue: ["Revenue", "Value"],
    conversions: ["Conversions", "Results", "Leads"],
    impressions: ["Impressions"],
    clicks: ["Clicks"],
    ctr: ["CTR"],
    cpc: ["CPC"],
    cpm: ["CPM"],
    costPerResult: ["CPA", "CPL"],
  },
};

const CHANNEL_NAMES: Record<AdChannel, string> = {
  meta: "Meta Ads",
  google: "Google Ads",
  tiktok: "TikTok Ads",
  linkedin: "LinkedIn Ads",
  other: "Other",
};

interface AdsChannelUploaderProps {
  channel: AdChannel;
  onDataParsed: (data: ChannelData) => void;
  onClose: () => void;
  existingData?: ChannelData | null;
  currencySymbol?: string;
}

export function AdsChannelUploader({ 
  channel, 
  onDataParsed, 
  onClose,
  existingData,
  currencySymbol,
}: AdsChannelUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
    headers: string[];
    rows: Record<string, string>[];
    channelData: ChannelData;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const channelName = CHANNEL_NAMES[channel];
  const columnMappings = COLUMN_MAPPINGS[channel];

  const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) throw new Error("File must have at least a header row and one data row");

    // Auto-detect delimiter by checking which one produces the most columns
    const detectDelimiter = (line: string): string => {
      const delimiters = [',', '\t', ';', '|'];
      let bestDelimiter = ',';
      let maxColumns = 0;
      
      for (const delim of delimiters) {
        // Simple split (not handling quotes for detection)
        const count = line.split(delim).length;
        if (count > maxColumns) {
          maxColumns = count;
          bestDelimiter = delim;
        }
      }
      return bestDelimiter;
    };

    const parseRow = (row: string, delimiter: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    // Common header keywords to identify the header row
    const commonHeaderKeywords = [
      "campaign", "clicks", "impr", "impressions", "cost", "spend", 
      "conversions", "conv", "ctr", "cpc", "cpm", "revenue", "results"
    ];

    // Find the best delimiter from a line that looks like headers
    let delimiter = ',';
    let headerRowIndex = 0;
    let bestScore = 0;

    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const testDelimiter = detectDelimiter(lines[i]);
      const cells = parseRow(lines[i], testDelimiter).map(c => c.toLowerCase());
      
      if (cells.length < 2) continue; // Skip rows with only 1 cell
      
      let score = 0;
      for (const cell of cells) {
        for (const keyword of commonHeaderKeywords) {
          if (cell.includes(keyword)) {
            score++;
            break;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        headerRowIndex = i;
        delimiter = testDelimiter;
      }
    }

    console.log(`[AdsChannelUploader] CSV: detected delimiter="${delimiter === '\t' ? 'TAB' : delimiter}", header row index=${headerRowIndex}`);

    const headers = parseRow(lines[headerRowIndex], delimiter);
    console.log(`[AdsChannelUploader] CSV headers (${headers.length}):`, headers);

    const dataLines = lines.slice(headerRowIndex + 1).filter(line => line.trim());
    const rows = dataLines.map(line => {
      const values = parseRow(line, delimiter);
      const row: Record<string, string> = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || "";
      });
      return row;
    });

    return { headers, rows };
  };

  const parseExcel = async (file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> => {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Read raw rows (no header inference yet)
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (jsonData.length < 2) throw new Error("File must have at least a header row and one data row");

    // Common header keywords we look for across all platforms
    const commonHeaderKeywords = [
      "campaign", "clicks", "impr", "impressions", "cost", "spend", 
      "conversions", "conv", "ctr", "cpc", "cpm", "revenue", "results"
    ];

    // Find the header row by looking for a row that contains multiple known column keywords
    let headerRowIndex = 0;
    let bestScore = 0;
    
    for (let i = 0; i < Math.min(jsonData.length, 20); i++) { // Check first 20 rows max
      const row = (jsonData[i] as any[]).map(h => String(h || "").trim().toLowerCase());
      if (row.every(cell => !cell)) continue; // skip completely empty rows

      // Count how many cells in this row match known header keywords
      let score = 0;
      for (const cell of row) {
        if (!cell) continue;
        for (const keyword of commonHeaderKeywords) {
          if (cell.includes(keyword)) {
            score++;
            break; // Only count each cell once
          }
        }
      }

      // Also check against channel-specific mappings
      const hasCampaign = !!findHeader(row.map(c => c || ""), columnMappings.campaignName.map(n => n.toLowerCase()));
      const hasSpend = !!findHeader(row.map(c => c || ""), columnMappings.spend.map(n => n.toLowerCase()));
      const hasImpressions = columnMappings.impressions 
        ? !!findHeader(row.map(c => c || ""), columnMappings.impressions.map(n => n.toLowerCase())) 
        : false;
      
      if (hasCampaign) score += 2;
      if (hasSpend) score += 2;
      if (hasImpressions) score += 2;

      // Pick the row with the highest score (most header-like)
      if (score > bestScore) {
        bestScore = score;
        headerRowIndex = i;
      }
    }

    // Final headers and data rows
    const headers = (jsonData[headerRowIndex] as any[]).map(h => String(h || "").trim());

    const dataRows = jsonData
      .slice(headerRowIndex + 1)
      // Drop trailing empty rows
      .filter((row) => (row as any[]).some(cell => String(cell ?? "").trim() !== ""));

    const rows = dataRows.map((row: any[]) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = String(row[i] ?? "").trim();
      });
      return obj;
    });

    console.log(`[AdsChannelUploader] Detected header row at index ${headerRowIndex}:`, headers);

    return { headers, rows };
  };

  const findHeader = (headers: string[], possibleNames: string[]): string | null => {
    for (const name of possibleNames) {
      const match = headers.find(h => h.toLowerCase() === name.toLowerCase());
      if (match) return match;
    }
    for (const name of possibleNames) {
      const match = headers.find(h => 
        h.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(h.toLowerCase())
      );
      if (match) return match;
    }
    return null;
  };

  const parseNumber = (val: string): number => {
    if (!val) return 0;
    const cleaned = val.replace(/[$€£¥,\s%]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const processData = (headers: string[], rows: Record<string, string>[]): ChannelData => {
    // Find column headers
    const dateCol = findHeader(headers, columnMappings.date);
    const campaignCol = findHeader(headers, columnMappings.campaignName);
    const adCol = findHeader(headers, columnMappings.adName);
    const formatCol = findHeader(headers, columnMappings.adFormat);
    const spendCol = findHeader(headers, columnMappings.spend);
    const revenueCol = findHeader(headers, columnMappings.revenue);
    const impressionsCol = findHeader(headers, columnMappings.impressions);
    const clicksCol = findHeader(headers, columnMappings.clicks);
    
    // Result Type and Results columns (Meta-specific)
    const resultTypeCol = columnMappings.resultType ? findHeader(headers, columnMappings.resultType) : null;
    const resultsCol = columnMappings.results ? findHeader(headers, columnMappings.results) : null;
    const resultValueCol = columnMappings.resultValue ? findHeader(headers, columnMappings.resultValue) : null;
    const conversionsCol = findHeader(headers, columnMappings.conversions);

    console.log(`[AdsChannelUploader] Column mapping results for ${channel}:`, {
      dateCol,
      campaignCol,
      spendCol,
      impressionsCol,
      clicksCol,
      conversionsCol,
      resultsCol,
    });

    // Aggregate by campaign (with result type breakdown)
    interface CampaignAccumulator {
      id: string;
      name: string;
      channel: AdChannel;
      spend: number;
      revenue: number;
      results: number;
      impressions: number;
      clicks: number;
      resultsByType: Map<ResultType, { count: number; value: number; spend: number }>;
    }
    
    const campaignMap = new Map<string, CampaignAccumulator>();
    const dailyMap = new Map<string, DailyMetrics>();
    const resultsByTypeMap = new Map<ResultType, { count: number; value: number; spend: number }>();
    
    let totalSpend = 0;
    let totalRevenue = 0;
    let totalResults = 0;
    let totalImpressions = 0;
    let totalClicks = 0;

    for (const row of rows) {
      const spend = spendCol ? parseNumber(row[spendCol]) : 0;
      const revenue = revenueCol ? parseNumber(row[revenueCol]) : 0;
      const impressions = impressionsCol ? parseNumber(row[impressionsCol]) : 0;
      const clicks = clicksCol ? parseNumber(row[clicksCol]) : 0;
      
      // Get results - prefer "Results" column, fallback to "Conversions"
      let results = 0;
      if (resultsCol) {
        results = parseNumber(row[resultsCol]);
      } else if (conversionsCol) {
        results = parseNumber(row[conversionsCol]);
      }
      
      // Get result type
      let resultType: ResultType = "other";
      let resultTypeName = "Other Results";
      if (resultTypeCol && row[resultTypeCol]) {
        resultType = parseResultType(row[resultTypeCol]);
        resultTypeName = row[resultTypeCol]; // Keep original name for display
      }
      
      // Get result value (for ROAS)
      const resultValue = resultValueCol ? parseNumber(row[resultValueCol]) : 0;

      totalSpend += spend;
      totalRevenue += revenue;
      totalResults += results;
      totalImpressions += impressions;
      totalClicks += clicks;
      
      // Aggregate results by type (channel level)
      if (results > 0) {
        const existingType = resultsByTypeMap.get(resultType) || { count: 0, value: 0, spend: 0 };
        existingType.count += results;
        existingType.value += resultValue;
        existingType.spend += spend;
        resultsByTypeMap.set(resultType, existingType);
      }

      // Aggregate by campaign
      if (campaignCol) {
        const campaignName = row[campaignCol] || "Unknown Campaign";
        const existing = campaignMap.get(campaignName) || {
          id: campaignName,
          name: campaignName,
          channel,
          spend: 0,
          revenue: 0,
          results: 0,
          impressions: 0,
          clicks: 0,
          resultsByType: new Map(),
        };
        existing.spend += spend;
        existing.revenue += revenue;
        existing.results += results;
        existing.impressions += impressions;
        existing.clicks += clicks;
        
        // Track result types per campaign
        if (results > 0) {
          const campType = existing.resultsByType.get(resultType) || { count: 0, value: 0, spend: 0 };
          campType.count += results;
          campType.value += resultValue;
          campType.spend += spend;
          existing.resultsByType.set(resultType, campType);
        }
        
        campaignMap.set(campaignName, existing);
      }

      // Aggregate by date
      if (dateCol) {
        let dateStr = row[dateCol];
        // Normalize date format to YYYY-MM-DD
        if (dateStr) {
          // Handle various date formats
          const dateMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
          if (dateMatch) {
            dateStr = dateMatch[0];
          } else {
            // Try to parse other formats
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
              dateStr = parsed.toISOString().split("T")[0];
            }
          }
        }
        
        if (dateStr) {
          const existing = dailyMap.get(dateStr) || {
            date: dateStr,
            spend: 0,
            revenue: 0,
            results: 0,
            impressions: 0,
            clicks: 0,
          };
          existing.spend += spend;
          existing.revenue += revenue;
          existing.results += results;
          existing.impressions += impressions;
          existing.clicks += clicks;
          dailyMap.set(dateStr, existing);
        }
      }
    }

    // Convert results by type map to array
    const resultsByType: ResultsByType[] = Array.from(resultsByTypeMap.entries()).map(([type, data]) => ({
      type,
      typeName: getResultTypeName(type),
      count: data.count,
      value: data.value,
      spend: data.spend,
    })).sort((a, b) => b.count - a.count);

    // Calculate campaign metrics
    const campaigns: CampaignData[] = Array.from(campaignMap.values()).map(c => {
      // Find primary result type (the one with most results)
      let primaryResultType: ResultType = "other";
      let primaryResultTypeName = "Other Results";
      let maxResults = 0;
      c.resultsByType.forEach((data, type) => {
        if (data.count > maxResults) {
          maxResults = data.count;
          primaryResultType = type;
          primaryResultTypeName = getResultTypeName(type);
        }
      });
      
      // Convert campaign result types to array
      const campaignResultsByType: ResultsByType[] = Array.from(c.resultsByType.entries()).map(([type, data]) => ({
        type,
        typeName: getResultTypeName(type),
        count: data.count,
        value: data.value,
        spend: data.spend,
      }));
      
      return {
        id: c.id,
        name: c.name,
        channel: c.channel,
        spend: c.spend,
        revenue: c.revenue,
        results: c.results,
        impressions: c.impressions,
        clicks: c.clicks,
        roas: calculateRoas(c.revenue, c.spend),
        cpr: calculateCpr(c.spend, c.results),
        cpm: calculateCpm(c.spend, c.impressions),
        cpc: calculateCpc(c.spend, c.clicks),
        ctr: calculateCtr(c.clicks, c.impressions),
        resultsByType: campaignResultsByType,
        primaryResultType,
        primaryResultTypeName,
      };
    });

    // Sort campaigns by results (not revenue)
    campaigns.sort((a, b) => b.results - a.results);

    return {
      channel,
      channelName,
      spend: totalSpend,
      revenue: totalRevenue,
      results: totalResults,
      impressions: totalImpressions,
      clicks: totalClicks,
      roas: calculateRoas(totalRevenue, totalSpend),
      cpr: calculateCpr(totalSpend, totalResults),
      cpm: calculateCpm(totalSpend, totalImpressions),
      cpc: calculateCpc(totalSpend, totalClicks),
      ctr: calculateCtr(totalClicks, totalImpressions),
      campaigns,
      creatives: [],
      dailyData: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      resultsByType,
      rawData: rows,
    };
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    setError(null);
    setParsedData(null);

    console.log(`[AdsChannelUploader] Starting to parse file: ${file.name} for channel: ${channel}`);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let data: { headers: string[]; rows: Record<string, string>[] };

      if (ext === "csv") {
        const text = await file.text();
        data = parseCSV(text);
        console.log(`[AdsChannelUploader] CSV parsed. Headers:`, data.headers);
      } else if (ext === "xlsx" || ext === "xls") {
        data = await parseExcel(file);
        console.log(`[AdsChannelUploader] Excel parsed. Headers:`, data.headers);
      } else {
        throw new Error("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      }

      console.log(`[AdsChannelUploader] Total rows parsed: ${data.rows.length}`);
      if (data.rows.length > 0) {
        console.log(`[AdsChannelUploader] First row sample:`, data.rows[0]);
      }

      if (data.rows.length === 0) {
        throw new Error("No data rows found in the file");
      }

      const channelData = processData(data.headers, data.rows);
      
      console.log(`[AdsChannelUploader] Processed channelData:`, {
        spend: channelData.spend,
        impressions: channelData.impressions,
        results: channelData.results,
        clicks: channelData.clicks,
        campaigns: channelData.campaigns.length,
      });

      if (channelData.spend === 0 && channelData.impressions === 0) {
        console.error(`[AdsChannelUploader] FAILED: spend=${channelData.spend}, impressions=${channelData.impressions}`);
        console.error(`[AdsChannelUploader] Column mappings for ${channel}:`, columnMappings);
        console.error(`[AdsChannelUploader] Looking for spend columns:`, columnMappings.spend);
        console.error(`[AdsChannelUploader] Looking for impressions columns:`, columnMappings.impressions);
        console.error(`[AdsChannelUploader] Available headers:`, data.headers);
        throw new Error("Could not find spend or impressions data. Please check your file format.");
      }

      setParsedData({ headers: data.headers, rows: data.rows, channelData });
    } catch (err: any) {
      console.error(`[AdsChannelUploader] Error:`, err);
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

  const applyData = () => {
    if (!parsedData) return;
    onDataParsed(parsedData.channelData);
    onClose();
  };

  const symbol = currencySymbol ?? "$";
  const formatCurrency = (val: number) => symbol + val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const formatNumber = (val: number) => val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const formatPercent = (val: number) => val.toFixed(2) + "%";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">Import {channelName} Data</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload your {channelName} export (CSV or Excel)
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
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
                      Drop your {channelName} export here
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

              {existingData && (
                <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-blue-400 text-sm font-medium mb-2">Existing {channelName} data will be replaced</p>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Current Spend:</span>
                      <span className="text-white ml-2">{formatCurrency(existingData.spend)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Campaigns:</span>
                      <span className="text-white ml-2">{existingData.campaigns.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">ROAS:</span>
                      <span className="text-white ml-2">{existingData.roas.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Parsed data preview */}
              <div className="space-y-6">
                {/* Summary */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-white">
                    Parsed {parsedData.rows.length} rows with {parsedData.channelData.campaigns.length} campaigns
                  </span>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5">
                    <div className="text-xs text-slate-400">Total Spend</div>
                    <div className="text-lg font-semibold text-white">{formatCurrency(parsedData.channelData.spend)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5">
                    <div className="text-xs text-slate-400">Total Results</div>
                    <div className="text-lg font-semibold text-white">{formatNumber(parsedData.channelData.results)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5">
                    <div className="text-xs text-slate-400">Cost per Result</div>
                    <div className="text-lg font-semibold text-green-400">{formatCurrency(parsedData.channelData.cpr)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5">
                    <div className="text-xs text-slate-400">Impressions</div>
                    <div className="text-lg font-semibold text-white">{formatNumber(parsedData.channelData.impressions)}</div>
                  </div>
                </div>

                {/* Results by Type */}
                {parsedData.channelData.resultsByType.length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                    <div className="text-xs text-slate-400 mb-2">Results Breakdown by Type</div>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.channelData.resultsByType.map((r) => (
                        <div key={r.type} className="px-2 py-1 rounded bg-slate-700/50 text-xs">
                          <span className="text-white font-medium">{formatNumber(r.count)}</span>
                          <span className="text-slate-400 ml-1">{r.typeName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional metrics */}
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div className="p-2 rounded bg-slate-800/30">
                    <span className="text-slate-400">CPR:</span>
                    <span className="text-white ml-1">{formatCurrency(parsedData.channelData.cpr)}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-800/30">
                    <span className="text-slate-400">CPM:</span>
                    <span className="text-white ml-1">{formatCurrency(parsedData.channelData.cpm)}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-800/30">
                    <span className="text-slate-400">CPC:</span>
                    <span className="text-white ml-1">{formatCurrency(parsedData.channelData.cpc)}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-800/30">
                    <span className="text-slate-400">CTR:</span>
                    <span className="text-white ml-1">{formatPercent(parsedData.channelData.ctr)}</span>
                  </div>
                </div>

                {/* Top campaigns */}
                {parsedData.channelData.campaigns.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-white mb-2">Top Campaigns by Results</h3>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-800/50 sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2 text-slate-400">#</th>
                            <th className="text-left px-3 py-2 text-slate-400">Campaign</th>
                            <th className="text-left px-3 py-2 text-slate-400">Result Type</th>
                            <th className="text-right px-3 py-2 text-slate-400">Results</th>
                            <th className="text-right px-3 py-2 text-slate-400">CPR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {parsedData.channelData.campaigns.slice(0, 10).map((campaign, idx) => (
                            <tr key={campaign.id} className="hover:bg-white/5">
                              <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                              <td className="px-3 py-2 text-white truncate max-w-[180px]" title={campaign.name}>
                                {campaign.name}
                              </td>
                              <td className="px-3 py-2 text-slate-400 text-xs">
                                {campaign.primaryResultTypeName || "—"}
                              </td>
                              <td className="px-3 py-2 text-cyan-400 text-right">{formatNumber(campaign.results)}</td>
                              <td className="px-3 py-2 text-green-400 text-right">{formatCurrency(campaign.cpr)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Daily data info */}
                {parsedData.channelData.dailyData.length > 0 && (
                  <div className="text-xs text-slate-400">
                    📅 Found daily data from {parsedData.channelData.dailyData[0].date} to {parsedData.channelData.dailyData[parsedData.channelData.dailyData.length - 1].date}
                    ({parsedData.channelData.dailyData.length} days)
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 shrink-0">
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
                onClick={applyData}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition"
              >
                Import {channelName} Data
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
