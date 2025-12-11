import { NextRequest, NextResponse } from "next/server";
import { getSnowflakeClient, type AggregatedAdsData, type CampaignData } from "@/lib/snowflake";
import { generateSchemaName, FIVETRAN_SERVICES } from "@/lib/fivetran";

/**
 * POST /api/snowflake/ads-data
 * 
 * Fetch aggregated ads data from Snowflake for the connected platforms.
 * 
 * Body: {
 *   userId: string,
 *   platforms: string[],  // e.g., ["google_ads", "facebook_ads"]
 *   companyName?: string, // Company name for multi-client support
 *   year?: number         // defaults to current year
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, platforms, year, companyName } = body;

    console.log("[Snowflake ads-data] Request received:", { userId, platforms, year, companyName });

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: "platforms array is required" },
        { status: 400 }
      );
    }

    const snowflake = getSnowflakeClient();
    const targetYear = year || new Date().getFullYear();

    // Aggregate data from all connected platforms
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalRevenue = 0;
    let currencyCode: string | null = null; // Prefer currency from Google Ads account
    const byPlatform: Record<string, any> = {};
    const allCampaigns: CampaignData[] = [];
    
    // Google Ads specific data
    let googleAdsSearchTerms: any[] = [];
    let googleAdsHourlyStats: any[] = [];
    let googleAdsDeviceStats: any[] = [];
    let googleAdsMonthlyPerformance: any[] = [];
    let googleAdsTopCampaigns: any[] = [];

    for (const platform of platforms) {
      // Use companyName if provided for new multi-client schema naming
      const schemaName = generateSchemaName(userId, platform, companyName);
      console.log(`[Snowflake ads-data] Querying schema: ${schemaName} for platform: ${platform}`);
      
      let platformData: Partial<AggregatedAdsData> = {};
      let campaigns: CampaignData[] = [];

      switch (platform) {
        case FIVETRAN_SERVICES.GOOGLE_ADS:
          platformData = await snowflake.getGoogleAdsData(schemaName, targetYear);
          campaigns = await snowflake.getCampaigns(schemaName, platform, targetYear);
          // Try to read currency code from Google Ads ACCOUNT_HISTORY once
          if (!currencyCode) {
            currencyCode = await snowflake.getGoogleAdsCurrency(schemaName);
          }
          // Fetch Google Ads specific data for enhanced slides
          try {
            googleAdsSearchTerms = await snowflake.getGoogleAdsSearchTerms(schemaName, targetYear);
          } catch (e) {
            console.warn("[Snowflake ads-data] Could not fetch search terms:", e);
          }
          try {
            googleAdsHourlyStats = await snowflake.getGoogleAdsHourlyStats(schemaName, targetYear);
          } catch (e) {
            console.warn("[Snowflake ads-data] Could not fetch hourly stats:", e);
          }
          try {
            googleAdsDeviceStats = await snowflake.getGoogleAdsDeviceStats(schemaName, targetYear);
          } catch (e) {
            console.warn("[Snowflake ads-data] Could not fetch device stats:", e);
          }
          try {
            googleAdsMonthlyPerformance = await snowflake.getGoogleAdsMonthlyPerformance(schemaName, targetYear);
            console.log("[Snowflake ads-data] Monthly performance data:", googleAdsMonthlyPerformance.length, "months");
          } catch (e) {
            console.warn("[Snowflake ads-data] Could not fetch monthly performance:", e);
          }
          try {
            googleAdsTopCampaigns = await snowflake.getGoogleAdsTopCampaigns(schemaName, targetYear);
            console.log("[Snowflake ads-data] Top campaigns data:", googleAdsTopCampaigns.length, "campaigns");
          } catch (e) {
            console.warn("[Snowflake ads-data] Could not fetch top campaigns:", e);
          }
          break;
        case FIVETRAN_SERVICES.META_ADS:
          platformData = await snowflake.getMetaAdsData(schemaName, targetYear);
          campaigns = await snowflake.getCampaigns(schemaName, platform, targetYear);
          break;
        case FIVETRAN_SERVICES.LINKEDIN_ADS:
          platformData = await snowflake.getLinkedInAdsData(schemaName, targetYear);
          campaigns = await snowflake.getCampaigns(schemaName, platform, targetYear);
          break;
      }

      // Accumulate totals
      totalSpend += platformData.totalSpend || 0;
      totalImpressions += platformData.totalImpressions || 0;
      totalClicks += platformData.totalClicks || 0;
      totalConversions += platformData.totalConversions || 0;
      totalRevenue += platformData.totalRevenue || 0;

      // Store platform-specific data
      byPlatform[platform] = {
        spend: platformData.totalSpend || 0,
        impressions: platformData.totalImpressions || 0,
        clicks: platformData.totalClicks || 0,
        conversions: platformData.totalConversions || 0,
        revenue: platformData.totalRevenue || 0,
        ctr: platformData.blendedCtr || 0,
        cpc: platformData.blendedCpc || 0,
        roas: platformData.blendedRoas || 0,
        currencyCode: platform === FIVETRAN_SERVICES.GOOGLE_ADS ? currencyCode : undefined,
      };

      // Add campaigns
      allCampaigns.push(...campaigns);
    }

    // Calculate blended metrics
    const blendedCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const blendedCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // Sort campaigns by spend and take top 20
    const topCampaigns = allCampaigns
      .sort((a, b) => b.metrics.spend - a.metrics.spend)
      .slice(0, 20);

    const aggregatedData: AggregatedAdsData = {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      totalRevenue,
      blendedCtr,
      blendedCpc,
      blendedRoas,
      campaigns: topCampaigns,
      byPlatform,
      dateRange: {
        start: `${targetYear}-01-01`,
        end: `${targetYear}-12-31`,
      },
      // Optional currency code (primarily from Google Ads)
      currencyCode: currencyCode || undefined,
      // Google Ads specific data for enhanced slides
      googleAdsSearchTerms: googleAdsSearchTerms.length > 0 ? googleAdsSearchTerms : undefined,
      googleAdsHourlyStats: googleAdsHourlyStats.length > 0 ? googleAdsHourlyStats : undefined,
      googleAdsDeviceStats: googleAdsDeviceStats.length > 0 ? googleAdsDeviceStats : undefined,
      googleAdsMonthlyPerformance: googleAdsMonthlyPerformance.length > 0 ? googleAdsMonthlyPerformance : undefined,
      googleAdsTopCampaigns: googleAdsTopCampaigns.length > 0 ? googleAdsTopCampaigns : undefined,
    };

    console.log("[Snowflake ads-data] Aggregated data:", {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      totalRevenue,
      campaignCount: topCampaigns.length,
    });

    return NextResponse.json({
      success: true,
      data: aggregatedData,
    });
  } catch (error) {
    console.error("[Snowflake ads-data] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch ads data" },
      { status: 500 }
    );
  }
}
