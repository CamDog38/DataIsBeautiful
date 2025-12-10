// Types for multi-channel ads data aggregation

export type AdChannel = "meta" | "google" | "tiktok" | "linkedin" | "other";

// Result types from Meta Ads
export type ResultType = 
  | "website_purchases" 
  | "landing_page_views" 
  | "reach" 
  | "leads" 
  | "link_clicks"
  | "video_views"
  | "app_installs"
  | "messages"
  | "other";

export interface ResultsByType {
  type: ResultType;
  typeName: string; // Display name like "Website Purchases"
  count: number;
  value: number; // Result value (for ROAS)
  spend: number; // Spend attributed to this result type
}

// Map display names to result types
export function parseResultType(name: string): ResultType {
  const lower = name.toLowerCase().trim();
  if (lower.includes("purchase")) return "website_purchases";
  if (lower.includes("landing page")) return "landing_page_views";
  if (lower.includes("reach")) return "reach";
  if (lower.includes("lead")) return "leads";
  if (lower.includes("link click") || lower.includes("clicks")) return "link_clicks";
  if (lower.includes("video")) return "video_views";
  if (lower.includes("app") || lower.includes("install")) return "app_installs";
  if (lower.includes("message")) return "messages";
  return "other";
}

export function getResultTypeName(type: ResultType): string {
  const names: Record<ResultType, string> = {
    website_purchases: "Website Purchases",
    landing_page_views: "Landing Page Views",
    reach: "Reach",
    leads: "Leads",
    link_clicks: "Link Clicks",
    video_views: "Video Views",
    app_installs: "App Installs",
    messages: "Messages",
    other: "Other Results",
  };
  return names[type] || "Other Results";
}

export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  spend: number;
  revenue: number;
  results: number; // Total results (was conversions)
  impressions: number;
  clicks: number;
  resultsByType?: ResultsByType[]; // Breakdown by result type
}

export interface CampaignData {
  id: string;
  name: string;
  channel: AdChannel;
  spend: number;
  revenue: number;
  results: number; // Total results (was conversions)
  impressions: number;
  clicks: number;
  roas: number;
  cpr: number; // Cost per result (was cpl)
  cpm: number; // Cost per 1000 impressions
  cpc: number; // Cost per click
  ctr: number; // Click-through rate
  resultsByType?: ResultsByType[]; // Breakdown by result type
  primaryResultType?: ResultType; // Main result type for this campaign
  primaryResultTypeName?: string; // Display name
  dailyData?: DailyMetrics[];
}

export interface CreativeData {
  id: string;
  name: string;
  description: string;
  channel: AdChannel;
  campaignName: string;
  format: string; // Video, Image, Carousel, etc.
  spend: number;
  revenue: number;
  results: number; // Total results (was conversions)
  impressions: number;
  clicks: number;
  roas: number;
  resultType?: ResultType;
  resultTypeName?: string;
}

export interface ChannelData {
  channel: AdChannel;
  channelName: string; // Display name like "Meta Ads", "Google Ads"
  spend: number;
  revenue: number;
  results: number; // Total results (was conversions)
  impressions: number;
  clicks: number;
  roas: number;
  cpr: number; // Cost per result (was cpl)
  cpm: number;
  cpc: number;
  ctr: number;
  campaigns: CampaignData[];
  creatives: CreativeData[];
  dailyData: DailyMetrics[];
  resultsByType: ResultsByType[]; // Breakdown by result type
  rawData?: Record<string, string>[]; // Original parsed rows
}

export interface AggregatedAdsData {
  // Combined totals
  totalSpend: number;
  totalRevenue: number;
  totalResults: number; // Total results (was totalConversions)
  totalImpressions: number;
  totalClicks: number;
  
  // Results breakdown by type
  resultsByType: ResultsByType[];
  
  // Calculated metrics
  blendedRoas: number;
  averageCpr: number; // Cost per result (primary)
  averageCpl: number; // Legacy alias for averageCpr
  averageCpm: number;
  averageCpc: number;
  averageCtr: number;
  
  // Channel breakdown
  channels: ChannelData[];
  topChannelBySpend: ChannelData | null;
  secondChannel: ChannelData | null;
  bestRoasChannel: ChannelData | null;
  
  // Top campaigns (across all channels)
  topCampaignsByRevenue: CampaignData[];
  topCampaignsByRoas: CampaignData[];
  mostEfficientCampaign: CampaignData | null;
  
  // Top creatives
  topCreativeByResults: CreativeData | null;
  topCreativeByRoas: CreativeData | null;
  
  // Monthly breakdown
  monthlyData: {
    month: string; // YYYY-MM
    monthName: string; // "January", "February", etc.
    spend: number;
    revenue: number;
    results: number;
    roas: number;
    cpr: number; // Cost per result
  }[];
  bestMonthByRoas: { month: string; roas: number; cpr: number } | null;
  bestMonthByCpr: { month: string; roas: number; cpr: number } | null;
  
  // Legacy aliases for backward compatibility
  totalConversions: number;
  bestMonthByCpl: { month: string; roas: number; cpl: number } | null;
}

// Helper functions
export function calculateRoas(revenue: number, spend: number): number {
  return spend > 0 ? revenue / spend : 0;
}

export function calculateCpr(spend: number, results: number): number {
  return results > 0 ? spend / results : 0;
}

// Legacy alias
export function calculateCpl(spend: number, conversions: number): number {
  return calculateCpr(spend, conversions);
}

export function calculateCpm(spend: number, impressions: number): number {
  return impressions > 0 ? (spend / impressions) * 1000 : 0;
}

export function calculateCpc(spend: number, clicks: number): number {
  return clicks > 0 ? spend / clicks : 0;
}

export function calculateCtr(clicks: number, impressions: number): number {
  return impressions > 0 ? (clicks / impressions) * 100 : 0;
}

export function getMonthName(monthStr: string): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthNum = parseInt(monthStr.split("-")[1]) - 1;
  return months[monthNum] || monthStr;
}

export function aggregateChannelData(channels: ChannelData[]): AggregatedAdsData {
  // Calculate totals
  const totalSpend = channels.reduce((sum, c) => sum + c.spend, 0);
  const totalRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);
  const totalResults = channels.reduce((sum, c) => sum + c.results, 0);
  const totalImpressions = channels.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = channels.reduce((sum, c) => sum + c.clicks, 0);
  
  // Aggregate results by type across all channels
  const resultsByTypeMap = new Map<ResultType, ResultsByType>();
  for (const channel of channels) {
    for (const r of channel.resultsByType) {
      const existing = resultsByTypeMap.get(r.type) || { type: r.type, typeName: r.typeName, count: 0, value: 0, spend: 0 };
      existing.count += r.count;
      existing.value += r.value;
      existing.spend += r.spend;
      resultsByTypeMap.set(r.type, existing);
    }
  }
  const resultsByType = Array.from(resultsByTypeMap.values()).sort((a, b) => b.count - a.count);
  
  // Calculate blended metrics
  const blendedRoas = calculateRoas(totalRevenue, totalSpend);
  const averageCpr = calculateCpr(totalSpend, totalResults);
  const averageCpm = calculateCpm(totalSpend, totalImpressions);
  const averageCpc = calculateCpc(totalSpend, totalClicks);
  const averageCtr = calculateCtr(totalClicks, totalImpressions);
  
  // Sort channels by spend
  const sortedBySpend = [...channels].sort((a, b) => b.spend - a.spend);
  const topChannelBySpend = sortedBySpend[0] || null;
  const secondChannel = sortedBySpend[1] || null;
  
  // Best ROAS channel (minimum spend threshold of 1% of total)
  const minSpendThreshold = totalSpend * 0.01;
  const qualifiedChannels = channels.filter(c => c.spend >= minSpendThreshold);
  const bestRoasChannel = qualifiedChannels.length > 0
    ? qualifiedChannels.reduce((best, c) => c.roas > best.roas ? c : best)
    : null;
  
  // Collect all campaigns
  const allCampaigns = channels.flatMap(c => c.campaigns);
  const topCampaignsByRevenue = [...allCampaigns]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  const topCampaignsByRoas = [...allCampaigns]
    .filter(c => c.spend >= totalSpend * 0.005) // Min 0.5% of spend
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 10);
  const mostEfficientCampaign = topCampaignsByRoas[0] || null;
  
  // Collect all creatives
  const allCreatives = channels.flatMap(c => c.creatives);
  const topCreativeByResults = allCreatives.length > 0
    ? allCreatives.reduce((best, c) => c.results > best.results ? c : best)
    : null;
  const topCreativeByRoas = allCreatives.filter(c => c.spend > 0).length > 0
    ? allCreatives.filter(c => c.spend > 0).reduce((best, c) => c.roas > best.roas ? c : best)
    : null;
  
  // Aggregate daily data into monthly
  const dailyDataMap = new Map<string, DailyMetrics>();
  for (const channel of channels) {
    for (const day of channel.dailyData) {
      const existing = dailyDataMap.get(day.date) || {
        date: day.date,
        spend: 0,
        revenue: 0,
        results: 0,
        impressions: 0,
        clicks: 0,
      };
      existing.spend += day.spend;
      existing.revenue += day.revenue;
      existing.results += day.results;
      existing.impressions += day.impressions;
      existing.clicks += day.clicks;
      dailyDataMap.set(day.date, existing);
    }
  }
  
  // Group by month
  const monthlyMap = new Map<string, { spend: number; revenue: number; results: number }>();
  dailyDataMap.forEach((day) => {
    const month = day.date.substring(0, 7); // YYYY-MM
    const existing = monthlyMap.get(month) || { spend: 0, revenue: 0, results: 0 };
    existing.spend += day.spend;
    existing.revenue += day.revenue;
    existing.results += day.results;
    monthlyMap.set(month, existing);
  });
  
  const monthlyData = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      monthName: getMonthName(month),
      spend: data.spend,
      revenue: data.revenue,
      results: data.results,
      roas: calculateRoas(data.revenue, data.spend),
      cpr: calculateCpr(data.spend, data.results),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  // Best months
  const monthsWithData = monthlyData.filter(m => m.spend > 0 && m.results > 0);
  const bestMonthByRoas = monthsWithData.length > 0
    ? monthsWithData.reduce((best, m) => m.roas > best.roas ? m : best)
    : null;
  const bestMonthByCpr = monthsWithData.length > 0
    ? monthsWithData.reduce((best, m) => m.cpr < best.cpr ? m : best)
    : null;
  
  return {
    totalSpend,
    totalRevenue,
    totalResults,
    totalImpressions,
    totalClicks,
    resultsByType,
    blendedRoas,
    averageCpr,
    averageCpm,
    averageCpc,
    averageCtr,
    channels,
    topChannelBySpend,
    secondChannel,
    bestRoasChannel,
    topCampaignsByRevenue,
    topCampaignsByRoas,
    mostEfficientCampaign,
    topCreativeByResults,
    topCreativeByRoas,
    monthlyData,
    bestMonthByRoas: bestMonthByRoas ? { month: bestMonthByRoas.monthName, roas: bestMonthByRoas.roas, cpr: bestMonthByRoas.cpr } : null,
    bestMonthByCpr: bestMonthByCpr ? { month: bestMonthByCpr.monthName, roas: bestMonthByCpr.roas, cpr: bestMonthByCpr.cpr } : null,
    // Legacy aliases
    totalConversions: totalResults,
    averageCpl: averageCpr,
    bestMonthByCpl: bestMonthByCpr ? { month: bestMonthByCpr.monthName, roas: bestMonthByCpr.roas, cpl: bestMonthByCpr.cpr } : null,
  };
}

// Initial empty state
export const emptyAggregatedData: AggregatedAdsData = {
  totalSpend: 0,
  totalRevenue: 0,
  totalResults: 0,
  totalImpressions: 0,
  totalClicks: 0,
  resultsByType: [],
  blendedRoas: 0,
  averageCpr: 0,
  averageCpm: 0,
  averageCpc: 0,
  averageCtr: 0,
  channels: [],
  topChannelBySpend: null,
  secondChannel: null,
  bestRoasChannel: null,
  topCampaignsByRevenue: [],
  topCampaignsByRoas: [],
  mostEfficientCampaign: null,
  topCreativeByResults: null,
  topCreativeByRoas: null,
  monthlyData: [],
  bestMonthByRoas: null,
  bestMonthByCpr: null,
  // Legacy aliases
  totalConversions: 0,
  averageCpl: 0,
  bestMonthByCpl: null,
};
