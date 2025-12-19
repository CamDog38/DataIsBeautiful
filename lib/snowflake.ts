/**
 * Snowflake Client
 * 
 * This client handles querying data from Snowflake that was synced by Fivetran.
 * 
 * Fivetran syncs data into schemas named after the connection (e.g., user_123_google_ads).
 * Each ad platform has standard tables:
 * - Google Ads: ad_stats, campaign, ad_group, etc.
 * - Meta Ads: ads_insights, campaign, ad_set, etc.
 * - LinkedIn Ads: ad_analytics_by_campaign, campaign, etc.
 */

import snowflake from "snowflake-sdk";

interface SnowflakeConfig {
  account: string;
  username: string;
  password: string;
  database: string;
  warehouse: string;
  role?: string;
}

interface AdMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
}

interface CampaignData {
  id: string;
  name: string;
  status: string;
  platform: string;
  metrics: AdMetrics;
}

interface AggregatedAdsData {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  blendedCtr: number;
  blendedCpc: number;
  blendedRoas: number;
  campaigns: CampaignData[];
  byPlatform: Record<string, AdMetrics>;
  dateRange: {
    start: string;
    end: string;
  };
  // Optional currency code for the aggregated data (e.g. from Google Ads ACCOUNT_HISTORY)
  currencyCode?: string;
  // Platform summary objects used for overall metrics slides
  googleAdsSummary?: AdMetrics & { currencyCode?: string };
  metaAdsSummary?: AdMetrics & { currencyCode?: string };
  // Google Ads specific data for enhanced slides
  googleAdsSearchTerms?: {
    searchTerm: string;
    clicks: number;
    conversions: number;
    conversionValue: number;
    weight: number;
  }[];
  googleAdsHourlyStats?: {
    dayOfWeek: number;
    hour: number;
    impressions: number;
    clicks: number;
    conversions: number;
    conversionValue: number;
    spend: number;
  }[];
  googleAdsDeviceStats?: {
    device: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }[];
  googleAdsMonthlyPerformance?: {
    monthStart: string;
    spend: number;
    clicks: number;
    conversions: number;
    conversionsValue: number;
    roas: number;
    highlightLabel: string;
  }[];
  googleAdsTopCampaigns?: {
    campaignId: string;
    campaignName: string;
    impressions: number;
    clicks: number;
    conversions: number;
    conversionValue: number;
    spend: number;
    roas: number;
    costPerResult: number;
  }[];

  metaAdsMonthlyPerformance?: {
    monthStart: string;
    spend: number;
    clicks: number;
    results: number;
    highlightLabel: string;
  }[];
  metaAdsBestDayOfWeek?: {
    dayOfWeek: string;
    results: number;
  }[];
  metaAdsTopCampaignsByResults?: {
    campaignId: string;
    campaignName: string;
    results: number;
    spend: number;
    impressions: number;
    cpr: number | null;
  }[];
  metaAdsTopCampaignsByClicks?: {
    campaignId: string;
    campaignName: string;
    clicks: number;
  }[];

  metaAdsDeviceStats?: {
    device: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }[];
}

class SnowflakeClient {
  private config: SnowflakeConfig;
  private connection: snowflake.Connection | null = null;
  private schemaTablesCache = new Map<string, Set<string>>();

  constructor(config: SnowflakeConfig) {
    this.config = config;
  }

  private buildDateWhereClause(
    column: string,
    targetYear: number,
    dateFilter?: { startDate: string; endDate: string }
  ) {
    if (dateFilter?.startDate && dateFilter?.endDate) {
      return `${column} BETWEEN '${dateFilter.startDate}' AND '${dateFilter.endDate}'`;
    }
    return `YEAR(${column}) = ${targetYear}`;
  }

  private async getTablesInSchema(schemaName: string): Promise<Set<string>> {
    const upperSchema = schemaName.toUpperCase();
    const cached = this.schemaTablesCache.get(upperSchema);
    if (cached) return cached;

    const db = "FIVETRAN_DATABASE";
    const sql = `
      SELECT TABLE_NAME
      FROM ${db}.INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = '${upperSchema}'
    `;

    console.log("[Snowflake] Tables in schema query:", sql);

    const rows = await this.executeQuery<any>(sql);
    const tableSet = new Set<string>(rows.map((r: any) => (r.TABLE_NAME || "").toUpperCase()).filter(Boolean));
    this.schemaTablesCache.set(upperSchema, tableSet);
    return tableSet;
  }

  private async getMetaCapabilities(schemaName: string): Promise<{
    hasBasicCampaign: boolean;
    hasCampaignActions: boolean;
    deviceTable: "DELIVERY_PLATFORM_AND_DEVICE" | "DELIVERY_DEVICE" | "DELIVERY_PLATFORM" | null;
    hasPurchaseValue: boolean;
    hasBasicAd: boolean;
    hasBasicAdSet: boolean;
  }> {
    const tables = await this.getTablesInSchema(schemaName);

    const hasBasicCampaign = tables.has("BASIC_CAMPAIGN");
    const hasCampaignActions = tables.has("BASIC_CAMPAIGN_ACTIONS");
    const hasPurchaseValue = tables.has("BASIC_AD_ACTION_VALUES");
    const hasBasicAd = tables.has("BASIC_AD");
    const hasBasicAdSet = tables.has("BASIC_AD_SET");

    const deviceTable = tables.has("DELIVERY_PLATFORM_AND_DEVICE")
      ? "DELIVERY_PLATFORM_AND_DEVICE"
      : tables.has("DELIVERY_DEVICE")
        ? "DELIVERY_DEVICE"
        : tables.has("DELIVERY_PLATFORM")
          ? "DELIVERY_PLATFORM"
          : null;

    return { hasBasicCampaign, hasCampaignActions, deviceTable, hasPurchaseValue, hasBasicAd, hasBasicAdSet };
  }

  async getMetaAdsDeviceStats(
    schemaName: string,
    year?: number,
    dateFilter?: { startDate: string; endDate: string }
  ): Promise<{
    device: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }[]> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";

    const caps = await this.getMetaCapabilities(schemaName);
    if (!caps.deviceTable) return [];

    const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);

    const sql = `
      SELECT
        DEVICE_PLATFORM,
        SUM(SPEND) AS spend,
        SUM(IMPRESSIONS) AS impressions,
        SUM(INLINE_LINK_CLICKS) AS clicks,
        NULL AS ctr,
        NULL AS cpc
      FROM ${db}.${schemaName}.${caps.deviceTable}
      WHERE ${where}
      GROUP BY 1
      ORDER BY spend DESC
    `;

    console.log(`[Snowflake] Meta Ads device stats (${caps.deviceTable}) query:`, sql);

    try {
      const rows = await this.executeQuery<any>(sql);
      return rows.map((r: any) => ({
        device: r.DEVICE_PLATFORM || "UNKNOWN",
        spend: typeof r.SPEND === "number" ? r.SPEND : 0,
        impressions: typeof r.IMPRESSIONS === "number" ? r.IMPRESSIONS : 0,
        clicks: typeof r.CLICKS === "number" ? r.CLICKS : 0,
        conversions: 0,
      }));
    } catch (error) {
      console.error("Error fetching Meta Ads device stats:", error);
      return [];
    }
  }

  private async connect(): Promise<snowflake.Connection> {
    if (this.connection) {
      return this.connection;
    }

    return new Promise((resolve, reject) => {
      const connection = snowflake.createConnection({
        account: this.config.account,
        username: this.config.username,
        password: this.config.password,
        database: this.config.database,
        warehouse: this.config.warehouse,
        role: this.config.role,
      });

      connection.connect((err, conn) => {
        if (err) {
          console.error("Snowflake connection error:", err);
          reject(err);
        } else {
          this.connection = conn;
          resolve(conn);
        }
      });
    });
  }

  private async executeQuery<T>(sql: string): Promise<T[]> {
    const connection = await this.connect();

    return new Promise((resolve, reject) => {
      connection.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error("Snowflake query error:", err);
            reject(err);
          } else {
            resolve((rows || []) as T[]);
          }
        },
      });
    });
  }

  /**
   * Simple connectivity check
   * Runs a lightweight query to verify that the Snowflake connection works.
   */
  async testConnection(): Promise<{ ok: boolean; version?: string }> {
    try {
      const rows = await this.executeQuery<{ VERSION?: string }>(
        "SELECT CURRENT_VERSION() AS VERSION"
      );
      const version = rows[0]?.VERSION;

      return {
        ok: true,
        version,
      };
    } catch (error) {
      console.error("Snowflake testConnection failed:", error);
      throw error;
    }
  }

  /**
   * Get Snowflake table schema from INFORMATION_SCHEMA.COLUMNS
   * for a given schema (and optional list of tables) in FIVETRAN_DATABASE.
   */
  async getTableSchema(schemaName: string, tables?: string[]) {
    const db = "FIVETRAN_DATABASE";

    const upperSchema = schemaName.toUpperCase();
    let tableFilter = "";

    if (tables && tables.length > 0) {
      const inList = tables
        .map((t) => `'${t.toUpperCase()}'`)
        .join(", ");
      tableFilter = ` AND TABLE_NAME IN (${inList})`;
    }

    const sql = `
      SELECT
        TABLE_SCHEMA,
        TABLE_NAME,
        COLUMN_NAME,
        DATA_TYPE,
        ORDINAL_POSITION
      FROM ${db}.INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${upperSchema}'
      ${tableFilter}
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `;

    console.log("[Snowflake] Schema query:", sql);

    return this.executeQuery<any>(sql);
  }

  async getTableSchemaAggregated(schemaName: string, tables?: string[]) {
    const db = "FIVETRAN_DATABASE";

    const upperSchema = schemaName.toUpperCase();
    let tableFilter = "";

    if (tables && tables.length > 0) {
      const inList = tables
        .map((t) => `'${t.toUpperCase()}'`)
        .join(", ");
      tableFilter = ` AND TABLE_NAME IN (${inList})`;
    }

    const sql = `
      SELECT TABLE_NAME,
             ARRAY_AGG(
               OBJECT_CONSTRUCT(
                 'column', COLUMN_NAME,
                 'type', DATA_TYPE,
                 'nullable', IS_NULLABLE,
                 'position', ORDINAL_POSITION
               )
             ) AS COLUMNS
      FROM (
        SELECT TABLE_NAME,
               COLUMN_NAME,
               DATA_TYPE,
               IS_NULLABLE,
               ORDINAL_POSITION
        FROM ${db}.INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '${upperSchema}'
        ${tableFilter}
        ORDER BY TABLE_NAME, ORDINAL_POSITION
      )
      GROUP BY TABLE_NAME
      ORDER BY TABLE_NAME
    `;

    console.log("[Snowflake] Schema aggregated query:", sql);

    return this.executeQuery<any>(sql);
  }

  /**
   * Get aggregated Google Ads data for a user's schema
   * Uses FIVETRAN_DATABASE and the user's schema (e.g., user_demo_user_google_ads)
   * Tables: ACCOUNT_STATS for aggregated metrics
   */
  async getGoogleAdsData(
    schemaName: string,
    year?: number,
    dateFilter?: { startDate: string; endDate: string }
  ): Promise<Partial<AggregatedAdsData>> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";

    const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);
    
    // Google Ads ACCOUNT_STATS table synced by Fivetran
    // Column names are uppercase in Snowflake
    const sql = `
      SELECT 
        SUM(IMPRESSIONS) as TOTAL_IMPRESSIONS,
        SUM(CLICKS) as TOTAL_CLICKS,
        SUM(COST_MICROS) / 1000000 as TOTAL_SPEND,
        SUM(CONVERSIONS) as TOTAL_CONVERSIONS,
        SUM(CONVERSIONS_VALUE) as TOTAL_REVENUE
      FROM ${db}.${schemaName}.ACCOUNT_STATS
      WHERE ${where}
    `;
    
    console.log("[Snowflake] Google Ads query:", sql);

    try {
      const results = await this.executeQuery<any>(sql);
      const row = results[0] || {};

      const totalSpend = row.TOTAL_SPEND || 0;
      const totalImpressions = row.TOTAL_IMPRESSIONS || 0;
      const totalClicks = row.TOTAL_CLICKS || 0;
      const totalConversions = row.TOTAL_CONVERSIONS || 0;
      const totalRevenue = row.TOTAL_REVENUE || 0;

      return {
        totalSpend,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalRevenue,
        blendedCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        blendedCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        blendedRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      };
    } catch (error) {
      console.error("Error fetching Google Ads data:", error);
      return {};
    }
  }

  /**
   * Get Google Ads account currency code for a user's schema
   * Reads CURRENCY_CODE from ACCOUNT_HISTORY (latest active record).
   */
  async getGoogleAdsCurrency(schemaName: string): Promise<string | null> {
    const db = "FIVETRAN_DATABASE";

    const sql = `
      SELECT CURRENCY_CODE
      FROM ${db}.${schemaName}.ACCOUNT_HISTORY
      WHERE CURRENCY_CODE IS NOT NULL
      ORDER BY _FIVETRAN_SYNCED DESC
      LIMIT 1
    `;

    console.log("[Snowflake] Google Ads currency query:", sql);

    try {
      const rows = await this.executeQuery<{ CURRENCY_CODE?: string }>(sql);
      const code = rows[0]?.CURRENCY_CODE || null;
      return code || null;
    } catch (error) {
      console.error("Error fetching Google Ads currency:", error);
      return null;
    }
  }

  /**
   * Get Google Ads search term data for word cloud
   */
  async getGoogleAdsSearchTerms(
    schemaName: string,
    year?: number,
    dateFilter?: { startDate: string; endDate: string }
  ): Promise<{
    searchTerm: string;
    clicks: number;
    conversions: number;
    conversionValue: number;
    weight: number;
  }[]> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";

    const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);

    const sql = `
      SELECT
        SEARCH_TERM,
        SUM(CLICKS) AS TOTAL_CLICKS,
        SUM(CONVERSIONS) AS TOTAL_CONVERSIONS,
        SUM(CONVERSIONS_VALUE) AS TOTAL_CONVERSION_VALUE,
        (SUM(CLICKS) * 1) + (SUM(CONVERSIONS) * 5) + (SUM(CONVERSIONS_VALUE) / 10) AS WEIGHT
      FROM ${db}.${schemaName}.SEARCH_TERM_KEYWORD_STATS
      WHERE ${where}
      GROUP BY SEARCH_TERM
      HAVING SUM(CLICKS) >= 5
      ORDER BY WEIGHT DESC
      LIMIT 200
    `;

    console.log("[Snowflake] Google Ads search terms query:", sql);

    try {
      const rows = await this.executeQuery<any>(sql);
      return rows.map((r: any) => ({
        searchTerm: r.SEARCH_TERM || "",
        clicks: r.TOTAL_CLICKS || 0,
        conversions: r.TOTAL_CONVERSIONS || 0,
        conversionValue: r.TOTAL_CONVERSION_VALUE || 0,
        weight: r.WEIGHT || 0,
      }));
    } catch (error) {
      console.error("Error fetching Google Ads search terms:", error);
      return [];
    }
  }

  /**
   * Get Google Ads hourly stats by day of week for heatmap
   */
  async getGoogleAdsHourlyStats(
    schemaName: string,
    year?: number,
    dateFilter?: { startDate: string; endDate: string }
  ): Promise<{
    dayOfWeek: number;
    hour: number;
    impressions: number;
    clicks: number;
    conversions: number;
    conversionValue: number;
    spend: number;
  }[]> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";

    const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);

    const sql = `
      SELECT
        DAY_OF_WEEK,
        HOUR,
        SUM(IMPRESSIONS) AS IMPRESSIONS,
        SUM(CLICKS) AS CLICKS,
        SUM(CONVERSIONS) AS CONVERSIONS,
        SUM(CONVERSIONS_VALUE) AS CONVERSION_VALUE,
        SUM(COST_MICROS) / 1000000 AS SPEND
      FROM ${db}.${schemaName}.ACCOUNT_HOURLY_STATS
      WHERE ${where}
      GROUP BY DAY_OF_WEEK, HOUR
    `;

    console.log("[Snowflake] Google Ads hourly stats query:", sql);

    try {
      const rows = await this.executeQuery<any>(sql);
      console.log("[Snowflake] Google Ads hourly stats results:", rows.length, "rows");
      if (rows.length > 0) {
        console.log("[Snowflake] Sample hourly row:", JSON.stringify(rows[0]));
      }
      return rows.map((r: any) => ({
        dayOfWeek: r.DAY_OF_WEEK || 0,
        hour: r.HOUR || 0,
        impressions: r.IMPRESSIONS || 0,
        clicks: r.CLICKS || 0,
        conversions: r.CONVERSIONS || 0,
        conversionValue: r.CONVERSION_VALUE || 0,
        spend: r.SPEND || 0,
      }));
    } catch (error) {
      console.error("Error fetching Google Ads hourly stats:", error);
      return [];
    }
  }

  /**
   * Get Google Ads device breakdown
   */
  async getGoogleAdsDeviceStats(
    schemaName: string,
    year?: number,
    dateFilter?: { startDate: string; endDate: string }
  ): Promise<{
    device: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }[]> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";

    const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);

    const sql = `
      SELECT
        DEVICE,
        SUM(COST_MICROS) / 1000000 AS SPEND,
        SUM(IMPRESSIONS) AS IMPRESSIONS,
        SUM(CLICKS) AS CLICKS,
        SUM(CONVERSIONS) AS CONVERSIONS
      FROM ${db}.${schemaName}.CAMPAIGN_STATS
      WHERE ${where}
      GROUP BY DEVICE
    `;

    console.log("[Snowflake] Google Ads device stats query:", sql);

    try {
      const rows = await this.executeQuery<any>(sql);
      return rows.map((r: any) => ({
        device: r.DEVICE || "Unknown",
        spend: r.SPEND || 0,
        impressions: r.IMPRESSIONS || 0,
        clicks: r.CLICKS || 0,
        conversions: r.CONVERSIONS || 0,
      }));
    } catch (error) {
      console.error("Error fetching Google Ads device stats:", error);
      return [];
    }
  }

  /**
   * Get Google Ads monthly performance data with highlights
   */
  async getGoogleAdsMonthlyPerformance(
    schemaName: string,
    year?: number,
    dateFilter?: { startDate: string; endDate: string }
  ): Promise<{
    monthStart: string;
    spend: number;
    clicks: number;
    conversions: number;
    conversionsValue: number;
    roas: number;
    highlightLabel: string;
  }[]> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";

    const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);

    const sql = `
      WITH monthly AS (
        SELECT
          DATE_TRUNC('month', DATE) AS month_start,
          SUM(COST_MICROS) / 1000000 AS spend,
          SUM(CLICKS) AS clicks,
          SUM(CONVERSIONS) AS conversions,
          SUM(CONVERSIONS_VALUE) AS conversions_value,
          SUM(CONVERSIONS_VALUE) / NULLIF(SUM(COST_MICROS) / 1000000, 0) AS roas
        FROM ${db}.${schemaName}.ACCOUNT_STATS
        WHERE ${where}
        GROUP BY 1
      ),
      highest_roas AS (
        SELECT month_start FROM monthly ORDER BY roas DESC NULLS LAST LIMIT 1
      ),
      best_clicks AS (
        SELECT month_start FROM monthly ORDER BY clicks DESC NULLS LAST LIMIT 1
      ),
      most_expensive AS (
        SELECT month_start FROM monthly ORDER BY spend DESC NULLS LAST LIMIT 1
      )
      SELECT
        m.month_start,
        m.spend,
        m.clicks,
        m.conversions,
        m.conversions_value,
        m.roas,
        CASE
          WHEN m.month_start = (SELECT month_start FROM highest_roas) THEN 'HIGHEST_ROAS_MONTH'
          WHEN m.month_start = (SELECT month_start FROM best_clicks) THEN 'BEST_CLICK_VOLUME_MONTH'
          WHEN m.month_start = (SELECT month_start FROM most_expensive) THEN 'MOST_EXPENSIVE_MONTH'
          ELSE 'NORMAL_MONTH'
        END AS highlight_label
      FROM monthly m
      ORDER BY m.month_start
    `;

    console.log("[Snowflake] Google Ads monthly performance query:", sql);

    try {
      const rows = await this.executeQuery<any>(sql);
      console.log("[Snowflake] Google Ads monthly performance results:", rows.length, "rows");
      return rows.map((r: any) => ({
        monthStart: r.MONTH_START || "",
        spend: r.SPEND || 0,
        clicks: r.CLICKS || 0,
        conversions: r.CONVERSIONS || 0,
        conversionsValue: r.CONVERSIONS_VALUE || 0,
        roas: r.ROAS || 0,
        highlightLabel: r.HIGHLIGHT_LABEL || "NORMAL_MONTH",
      }));
    } catch (error) {
      console.error("Error fetching Google Ads monthly performance:", error);
      return [];
    }
  }

  /**
   * Get Google Ads top campaigns with detailed metrics
   */
  async getGoogleAdsTopCampaigns(
    schemaName: string,
    year?: number,
    dateFilter?: { startDate: string; endDate: string }
  ): Promise<{
    campaignId: string;
    campaignName: string;
    impressions: number;
    clicks: number;
    conversions: number;
    conversionValue: number;
    spend: number;
    roas: number;
    costPerResult: number;
  }[]> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";

    const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);

    const sql = `
      WITH campaign_perf AS (
        SELECT
          ID AS CAMPAIGN_ID,
          SUM(IMPRESSIONS) AS IMPRESSIONS,
          SUM(CLICKS) AS CLICKS,
          SUM(CONVERSIONS) AS CONVERSIONS,
          SUM(CONVERSIONS_VALUE) AS CONVERSION_VALUE,
          SUM(COST_MICROS) / 1000000 AS SPEND
        FROM ${db}.${schemaName}.CAMPAIGN_STATS
        WHERE ${where}
        GROUP BY ID
      ),
      latest_campaign AS (
        SELECT
          ID AS CAMPAIGN_ID,
          NAME AS CAMPAIGN_NAME
        FROM ${db}.${schemaName}.CAMPAIGN_HISTORY
        QUALIFY ROW_NUMBER() OVER (PARTITION BY ID ORDER BY _FIVETRAN_SYNCED DESC) = 1
      )
      SELECT
        p.CAMPAIGN_ID,
        c.CAMPAIGN_NAME,
        p.IMPRESSIONS,
        p.CLICKS,
        p.CONVERSIONS,
        p.CONVERSION_VALUE,
        p.SPEND,
        p.CONVERSION_VALUE / NULLIF(p.SPEND, 0) AS ROAS,
        p.SPEND / NULLIF(p.CONVERSIONS, 0) AS COST_PER_RESULT
      FROM campaign_perf p
      LEFT JOIN latest_campaign c ON p.CAMPAIGN_ID = c.CAMPAIGN_ID
      ORDER BY p.CONVERSIONS DESC NULLS LAST
      LIMIT 10
    `;

    console.log("[Snowflake] Google Ads top campaigns query:", sql);

    try {
      const rows = await this.executeQuery<any>(sql);
      console.log("[Snowflake] Google Ads top campaigns results:", rows.length, "rows");
      return rows.map((r: any) => ({
        campaignId: r.CAMPAIGN_ID || "",
        campaignName: r.CAMPAIGN_NAME || "Unknown Campaign",
        impressions: r.IMPRESSIONS || 0,
        clicks: r.CLICKS || 0,
        conversions: r.CONVERSIONS || 0,
        conversionValue: r.CONVERSION_VALUE || 0,
        spend: r.SPEND || 0,
        roas: r.ROAS || 0,
        costPerResult: r.COST_PER_RESULT || 0,
      }));
    } catch (error) {
      console.error("Error fetching Google Ads top campaigns:", error);
      return [];
    }
  }

  /**
   * Get aggregated Meta (Facebook) Ads data for a user's schema
   * Uses FIVETRAN_DATABASE and the user's schema
   */
  async getMetaAdsData(
    schemaName: string,
    year?: number,
    dateFilter?: { startDate: string; endDate: string }
  ): Promise<Partial<AggregatedAdsData>> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";

    const caps = await this.getMetaCapabilities(schemaName);
    if (!caps.hasBasicCampaign) return {};

    const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);

    const totalsSql = `
      SELECT
        MIN(DATE) AS START_DATE,
        MAX(DATE) AS END_DATE,
        SUM(SPEND) AS TOTAL_SPEND,
        SUM(IMPRESSIONS) AS TOTAL_IMPRESSIONS,
        SUM(INLINE_LINK_CLICKS) AS TOTAL_CLICKS
      FROM ${db}.${schemaName}.BASIC_CAMPAIGN
      WHERE ${where}
    `;

    console.log("[Snowflake] Meta Ads totals (BASIC_CAMPAIGN) query:", totalsSql);

    try {
      const totalsRows = await this.executeQuery<any>(totalsSql);
      const totals = totalsRows[0] || {};

      const totalSpend = totals.TOTAL_SPEND || 0;
      const totalImpressions = totals.TOTAL_IMPRESSIONS || 0;
      const totalClicks = totals.TOTAL_CLICKS || 0;

      let totalConversions = 0;
      if (caps.hasCampaignActions) {
        const actionsWhere = this.buildDateWhereClause("DATE", targetYear, dateFilter);
        const resultsSql = `
          SELECT
            SUM(COALESCE(_7_D_CLICK, VALUE)) AS TOTAL_CONVERSIONS
          FROM ${db}.${schemaName}.BASIC_CAMPAIGN_ACTIONS
          WHERE ACTION_TYPE = 'landing_page_view'
            AND ${actionsWhere}
        `;
        console.log("[Snowflake] Meta Ads results (BASIC_CAMPAIGN_ACTIONS) query:", resultsSql);
        const resultsRows = await this.executeQuery<any>(resultsSql);
        totalConversions = (resultsRows[0] && resultsRows[0].TOTAL_CONVERSIONS) ? resultsRows[0].TOTAL_CONVERSIONS : 0;
      }

      const totalRevenue = 0;

      return {
        totalSpend,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalRevenue,
        blendedCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        blendedCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        blendedRoas: 0,
      };
    } catch (error) {
      console.error("Error fetching Meta Ads data:", error);
      return {};
    }
  }

  async getMetaAdsMonthlyPerformance(
    schemaName: string,
    year?: number,
    dateFilter?: { startDate: string; endDate: string }
  ): Promise<{
    monthStart: string;
    spend: number;
    clicks: number;
    results: number;
    highlightLabel: string;
  }[]> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";

    const caps = await this.getMetaCapabilities(schemaName);
    if (!caps.hasBasicCampaign || !caps.hasCampaignActions) return [];

    const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);

    const sql = `
      WITH campaign_daily AS (
        SELECT
          DATE,
          CAMPAIGN_ID,
          CAMPAIGN_NAME,
          SUM(SPEND) AS spend,
          SUM(IMPRESSIONS) AS impressions,
          SUM(INLINE_LINK_CLICKS) AS clicks
        FROM ${db}.${schemaName}.BASIC_CAMPAIGN
        WHERE ${where}
        GROUP BY 1,2,3
      ),
      results_daily AS (
        SELECT
          DATE,
          CAMPAIGN_ID,
          SUM(COALESCE(_7_D_CLICK, VALUE)) AS results
        FROM ${db}.${schemaName}.BASIC_CAMPAIGN_ACTIONS
        WHERE ACTION_TYPE = 'purchase'
          AND ${where}
        GROUP BY 1,2
      ),
      final AS (
        SELECT
          d.DATE,
          d.CAMPAIGN_ID,
          d.CAMPAIGN_NAME,
          d.spend,
          d.clicks,
          COALESCE(r.results, 0) AS results
        FROM campaign_daily d
        LEFT JOIN results_daily r
          ON r.DATE = d.DATE
         AND r.CAMPAIGN_ID = d.CAMPAIGN_ID
      ),
      monthly AS (
        SELECT
          DATE_TRUNC('MONTH', DATE) AS month_start,
          SUM(spend) AS spend,
          SUM(clicks) AS clicks,
          SUM(results) AS results
        FROM final
        GROUP BY 1
      ),
      best_results AS (
        SELECT month_start FROM monthly ORDER BY results DESC NULLS LAST LIMIT 1
      ),
      best_clicks AS (
        SELECT month_start FROM monthly ORDER BY clicks DESC NULLS LAST LIMIT 1
      ),
      most_expensive AS (
        SELECT month_start FROM monthly ORDER BY spend DESC NULLS LAST LIMIT 1
      )
      SELECT
        m.month_start,
        m.spend,
        m.clicks,
        m.results,
        CASE
          WHEN m.month_start = (SELECT month_start FROM best_results) THEN 'BEST_RESULTS_MONTH'
          WHEN m.month_start = (SELECT month_start FROM best_clicks) THEN 'BEST_CLICK_VOLUME_MONTH'
          WHEN m.month_start = (SELECT month_start FROM most_expensive) THEN 'MOST_EXPENSIVE_MONTH'
          ELSE 'NORMAL_MONTH'
        END AS highlight_label
      FROM monthly m
      ORDER BY m.month_start
    `;

    console.log("[Snowflake] Meta Ads monthly performance query:", sql);

    try {
      const rows = await this.executeQuery<any>(sql);
      return rows.map((r: any) => ({
        monthStart: r.MONTH_START || "",
        spend: r.SPEND || 0,
        clicks: r.CLICKS || 0,
        results: r.RESULTS || 0,
        highlightLabel: r.HIGHLIGHT_LABEL || "NORMAL_MONTH",
      }));
    } catch (error) {
      console.error("Error fetching Meta Ads monthly performance:", error);
      return [];
    }
  }

  async getMetaAdsBestDayOfWeek(
    schemaName: string,
    year?: number,
    dateFilter?: { startDate: string; endDate: string }
  ): Promise<{
    dayOfWeek: string;
    results: number;
  }[]> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";

    const caps = await this.getMetaCapabilities(schemaName);
    if (!caps.hasBasicCampaign || !caps.hasCampaignActions) return [];

    const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);

    const sql = `
      WITH campaign_daily AS (
        SELECT
          DATE,
          CAMPAIGN_ID,
          CAMPAIGN_NAME,
          SUM(SPEND) AS spend,
          SUM(IMPRESSIONS) AS impressions,
          SUM(INLINE_LINK_CLICKS) AS clicks
        FROM ${db}.${schemaName}.BASIC_CAMPAIGN
        WHERE ${where}
        GROUP BY 1,2,3
      ),
      results_daily AS (
        SELECT
          DATE,
          CAMPAIGN_ID,
          SUM(COALESCE(_7_D_CLICK, VALUE)) AS results
        FROM ${db}.${schemaName}.BASIC_CAMPAIGN_ACTIONS
        WHERE ACTION_TYPE = 'landing_page_view'
          AND ${where}
        GROUP BY 1,2
      ),
      final AS (
        SELECT
          d.DATE,
          d.CAMPAIGN_ID,
          d.CAMPAIGN_NAME,
          d.spend,
          d.clicks,
          COALESCE(r.results, 0) AS results
        FROM campaign_daily d
        LEFT JOIN results_daily r
          ON r.DATE = d.DATE
         AND r.CAMPAIGN_ID = d.CAMPAIGN_ID
      )
      SELECT
        DAYNAME(DATE) AS day_of_week,
        SUM(results) AS results
      FROM final
      GROUP BY 1
      ORDER BY results DESC
    `;

    console.log("[Snowflake] Meta Ads best day of week query:", sql);

    try {
      const rows = await this.executeQuery<any>(sql);
      return rows.map((r: any) => ({
        dayOfWeek: r.DAY_OF_WEEK || "",
        results: r.RESULTS || 0,
      }));
    } catch (error) {
      console.error("Error fetching Meta Ads best day of week:", error);
      return [];
    }
  }

  async getMetaAdsTopCampaignsByResults(
    schemaName: string,
    year?: number,
    dateFilter?: { startDate: string; endDate: string }
  ): Promise<{
    campaignId: string;
    campaignName: string;
    results: number;
    spend: number;
    impressions: number;
    cpr: number | null;
  }[]> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";

    const caps = await this.getMetaCapabilities(schemaName);
    if (!caps.hasBasicCampaign || !caps.hasCampaignActions) return [];

    const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);

    const sql = `
      WITH campaign_daily AS (
        SELECT
          DATE,
          CAMPAIGN_ID,
          CAMPAIGN_NAME,
          SUM(SPEND) AS spend,
          SUM(IMPRESSIONS) AS impressions,
          SUM(INLINE_LINK_CLICKS) AS clicks
        FROM ${db}.${schemaName}.BASIC_CAMPAIGN
        WHERE ${where}
        GROUP BY 1,2,3
      ),
      results_daily AS (
        SELECT
          DATE,
          CAMPAIGN_ID,
          SUM(COALESCE(_7_D_CLICK, VALUE)) AS results
        FROM ${db}.${schemaName}.BASIC_CAMPAIGN_ACTIONS
        WHERE ACTION_TYPE = 'purchase'
          AND ${where}
        GROUP BY 1,2
      ),
      final AS (
        SELECT
          d.CAMPAIGN_ID,
          d.CAMPAIGN_NAME,
          d.spend,
          d.impressions,
          COALESCE(r.results, 0) AS results
        FROM campaign_daily d
        LEFT JOIN results_daily r
          ON r.DATE = d.DATE
         AND r.CAMPAIGN_ID = d.CAMPAIGN_ID
      )
      SELECT
        CAMPAIGN_ID,
        CAMPAIGN_NAME,
        SUM(results) AS results,
        SUM(spend) AS spend,
        SUM(impressions) AS impressions,
        CASE WHEN SUM(results) = 0 THEN NULL ELSE SUM(spend) / SUM(results) END AS cpr
      FROM final
      GROUP BY 1,2
      ORDER BY results DESC
      LIMIT 5
    `;

    console.log("[Snowflake] Meta Ads top campaigns by purchases query:", sql);

    try {
      const rows = await this.executeQuery<any>(sql);
      return rows.map((r: any) => ({
        campaignId: r.CAMPAIGN_ID || "",
        campaignName: r.CAMPAIGN_NAME || "Unknown Campaign",
        results: r.RESULTS || 0,
        spend: r.SPEND || 0,
        impressions: r.IMPRESSIONS || 0,
        cpr: r.CPR === null || typeof r.CPR === "undefined" ? null : (r.CPR || 0),
      }));
    } catch (error) {
      console.error("Error fetching Meta Ads top campaigns by results:", error);
      return [];
    }
  }

  async getMetaAdsTopCampaignsByClicks(schemaName: string, year?: number): Promise<{
    campaignId: string;
    campaignName: string;
    clicks: number;
  }[]> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";

    const caps = await this.getMetaCapabilities(schemaName);
    if (!caps.hasBasicCampaign) return [];

    const sql = `
      WITH campaign_daily AS (
        SELECT
          DATE,
          CAMPAIGN_ID,
          CAMPAIGN_NAME,
          SUM(INLINE_LINK_CLICKS) AS clicks
        FROM ${db}.${schemaName}.BASIC_CAMPAIGN
        WHERE YEAR(DATE) = ${targetYear}
        GROUP BY 1,2,3
      )
      SELECT
        CAMPAIGN_ID,
        CAMPAIGN_NAME,
        SUM(clicks) AS clicks
      FROM campaign_daily
      GROUP BY 1,2
      ORDER BY clicks DESC
      LIMIT 5
    `;

    console.log("[Snowflake] Meta Ads top campaigns by clicks query:", sql);

    try {
      const rows = await this.executeQuery<any>(sql);
      return rows.map((r: any) => ({
        campaignId: r.CAMPAIGN_ID || "",
        campaignName: r.CAMPAIGN_NAME || "Unknown Campaign",
        clicks: r.CLICKS || 0,
      }));
    } catch (error) {
      console.error("Error fetching Meta Ads top campaigns by clicks:", error);
      return [];
    }
  }

  /**
   * Get aggregated LinkedIn Ads data for a user's schema
   * Uses FIVETRAN_DATABASE and the user's schema
   */
  async getLinkedInAdsData(schemaName: string, year?: number): Promise<Partial<AggregatedAdsData>> {
    const targetYear = year || new Date().getFullYear();
    const db = "FIVETRAN_DATABASE";
    
    // LinkedIn Ads tables synced by Fivetran
    const sql = `
      SELECT 
        SUM(IMPRESSIONS) as TOTAL_IMPRESSIONS,
        SUM(CLICKS) as TOTAL_CLICKS,
        SUM(COST_IN_LOCAL_CURRENCY) as TOTAL_SPEND,
        SUM(CONVERSIONS) as TOTAL_CONVERSIONS,
        SUM(CONVERSION_VALUE_IN_LOCAL_CURRENCY) as TOTAL_REVENUE
      FROM ${db}.${schemaName}.AD_ANALYTICS_BY_CAMPAIGN
      WHERE YEAR(START_AT) = ${targetYear}
    `;
    
    console.log("[Snowflake] LinkedIn Ads query:", sql);

    try {
      const results = await this.executeQuery<any>(sql);
      const row = results[0] || {};

      const totalSpend = row.TOTAL_SPEND || 0;
      const totalImpressions = row.TOTAL_IMPRESSIONS || 0;
      const totalClicks = row.TOTAL_CLICKS || 0;
      const totalConversions = row.TOTAL_CONVERSIONS || 0;
      const totalRevenue = row.TOTAL_REVENUE || 0;

      return {
        totalSpend,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalRevenue,
        blendedCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        blendedCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        blendedRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      };
    } catch (error) {
      console.error("Error fetching LinkedIn Ads data:", error);
      return {};
    }
  }

  /**
   * Get campaign-level data for a platform
   */
  async getCampaigns(
    schemaName: string,
    platform: string,
    year?: number,
    dateFilter?: { startDate: string; endDate: string }
  ): Promise<CampaignData[]> {
    const targetYear = year || new Date().getFullYear();
    
    let sql = "";
    
    switch (platform) {
      case "google_ads":
        {
          const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);
        // Use CTE with QUALIFY to get latest campaign names and join with stats
        sql = `
          WITH campaign_perf AS (
            SELECT
              ID AS CAMPAIGN_ID,
              SUM(IMPRESSIONS) AS IMPRESSIONS,
              SUM(CLICKS) AS CLICKS,
              SUM(CONVERSIONS) AS CONVERSIONS,
              SUM(CONVERSIONS_VALUE) AS REVENUE,
              SUM(COST_MICROS) / 1000000 AS SPEND
            FROM FIVETRAN_DATABASE.${schemaName}.CAMPAIGN_STATS
            WHERE ${where}
            GROUP BY ID
          ),
          latest_campaign AS (
            SELECT
              ID AS CAMPAIGN_ID,
              NAME AS CAMPAIGN_NAME,
              STATUS
            FROM FIVETRAN_DATABASE.${schemaName}.CAMPAIGN_HISTORY
            QUALIFY ROW_NUMBER() OVER (PARTITION BY ID ORDER BY _FIVETRAN_SYNCED DESC) = 1
          )
          SELECT
            p.CAMPAIGN_ID AS ID,
            c.CAMPAIGN_NAME AS NAME,
            c.STATUS,
            p.IMPRESSIONS,
            p.CLICKS,
            p.CONVERSIONS,
            p.REVENUE,
            p.SPEND,
            p.REVENUE / NULLIF(p.SPEND, 0) AS ROAS,
            p.SPEND / NULLIF(p.CONVERSIONS, 0) AS COST_PER_RESULT
          FROM campaign_perf p
          LEFT JOIN latest_campaign c ON p.CAMPAIGN_ID = c.CAMPAIGN_ID
          ORDER BY p.CONVERSIONS DESC NULLS LAST
          LIMIT 20
        `;
        console.log("[Snowflake] Google Ads campaigns query:", sql);
        }
        break;
      case "facebook_ads":
        // Schema-safe Meta campaigns derived from BASIC_CAMPAIGN (+ BASIC_CAMPAIGN_ACTIONS if available)
        {
          const caps = await this.getMetaCapabilities(schemaName);
          if (!caps.hasBasicCampaign) return [];

          const where = this.buildDateWhereClause("DATE", targetYear, dateFilter);

          if (caps.hasCampaignActions) {
            sql = `
              WITH campaign_daily AS (
                SELECT
                  DATE,
                  CAMPAIGN_ID,
                  CAMPAIGN_NAME,
                  SUM(SPEND) AS spend,
                  SUM(IMPRESSIONS) AS impressions,
                  SUM(INLINE_LINK_CLICKS) AS clicks
                FROM FIVETRAN_DATABASE.${schemaName}.BASIC_CAMPAIGN
                WHERE ${where}
                GROUP BY 1,2,3
              ),
              results_daily AS (
                SELECT
                  DATE,
                  CAMPAIGN_ID,
                  SUM(COALESCE(_7_D_CLICK, VALUE)) AS conversions
                FROM FIVETRAN_DATABASE.${schemaName}.BASIC_CAMPAIGN_ACTIONS
                WHERE ACTION_TYPE = 'landing_page_view'
                  AND ${where}
                GROUP BY 1,2
              ),
              final AS (
                SELECT
                  d.CAMPAIGN_ID,
                  d.CAMPAIGN_NAME,
                  d.spend,
                  d.impressions,
                  d.clicks,
                  COALESCE(r.conversions, 0) AS conversions
                FROM campaign_daily d
                LEFT JOIN results_daily r
                  ON r.DATE = d.DATE
                 AND r.CAMPAIGN_ID = d.CAMPAIGN_ID
              )
              SELECT
                CAMPAIGN_ID AS ID,
                CAMPAIGN_NAME AS NAME,
                '' AS STATUS,
                SUM(impressions) AS IMPRESSIONS,
                SUM(clicks) AS CLICKS,
                SUM(spend) AS SPEND,
                SUM(conversions) AS CONVERSIONS,
                0 AS REVENUE
              FROM final
              GROUP BY 1,2,3
              ORDER BY SPEND DESC
              LIMIT 20
            `;
          } else {
            sql = `
              SELECT
                CAMPAIGN_ID AS ID,
                CAMPAIGN_NAME AS NAME,
                '' AS STATUS,
                SUM(IMPRESSIONS) AS IMPRESSIONS,
                SUM(INLINE_LINK_CLICKS) AS CLICKS,
                SUM(SPEND) AS SPEND,
                0 AS CONVERSIONS,
                0 AS REVENUE
              FROM FIVETRAN_DATABASE.${schemaName}.BASIC_CAMPAIGN
              WHERE ${where}
              GROUP BY 1,2,3
              ORDER BY SPEND DESC
              LIMIT 20
            `;
          }

          console.log("[Snowflake] Meta Ads campaigns query:", sql);
        }
        break;
      case "linkedin_ads":
        {
        const where = dateFilter?.startDate && dateFilter?.endDate
          ? `START_AT BETWEEN '${dateFilter.startDate}' AND '${dateFilter.endDate}'`
          : `YEAR(START_AT) = ${targetYear}`;
        sql = `
          SELECT 
            c.ID,
            c.NAME,
            c.STATUS,
            SUM(a.IMPRESSIONS) as IMPRESSIONS,
            SUM(a.CLICKS) as CLICKS,
            SUM(a.COST_IN_LOCAL_CURRENCY) as SPEND,
            SUM(a.CONVERSIONS) as CONVERSIONS,
            SUM(a.CONVERSION_VALUE_IN_LOCAL_CURRENCY) as REVENUE
          FROM FIVETRAN_DATABASE.${schemaName}.CAMPAIGN c
          JOIN FIVETRAN_DATABASE.${schemaName}.AD_ANALYTICS_BY_CAMPAIGN a ON c.ID = a.CAMPAIGN_ID
          WHERE ${where}
          GROUP BY c.ID, c.NAME, c.STATUS
          ORDER BY SPEND DESC
          LIMIT 20
        `;
        console.log("[Snowflake] LinkedIn Ads campaigns query:", sql);
        }
        break;
      default:
        return [];
    }

    try {
      const results = await this.executeQuery<any>(sql);
      
      return results.map((row) => {
        const spend = row.SPEND || 0;
        const impressions = row.IMPRESSIONS || 0;
        const clicks = row.CLICKS || 0;
        const conversions = row.CONVERSIONS || 0;
        const revenue = row.REVENUE || 0;

        return {
          id: row.ID,
          name: row.NAME,
          status: row.STATUS,
          platform,
          metrics: {
            impressions,
            clicks,
            spend,
            conversions,
            revenue,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? spend / clicks : 0,
            cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
            roas: spend > 0 ? revenue / spend : 0,
          },
        };
      });
    } catch (error) {
      console.error(`Error fetching ${platform} campaigns:`, error);
      return [];
    }
  }

  /**
   * Close the connection
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      return new Promise((resolve) => {
        this.connection!.destroy((err) => {
          if (err) {
            console.error("Error disconnecting from Snowflake:", err);
          }
          this.connection = null;
          resolve();
        });
      });
    }
  }
}

// Singleton instance
let snowflakeClient: SnowflakeClient | null = null;

/**
 * Get the Snowflake client instance
 * Throws if environment variables are not configured
 */
export function getSnowflakeClient(): SnowflakeClient {
  if (snowflakeClient) {
    return snowflakeClient;
  }

  const account = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  const password = process.env.SNOWFLAKE_PASSWORD;
  const database = process.env.SNOWFLAKE_DATABASE;
  const warehouse = process.env.SNOWFLAKE_WAREHOUSE;
  const role = process.env.SNOWFLAKE_ROLE;

  if (!account || !username || !password || !database || !warehouse) {
    throw new Error(
      "Snowflake configuration missing. Please set SNOWFLAKE_ACCOUNT, SNOWFLAKE_USERNAME, SNOWFLAKE_PASSWORD, SNOWFLAKE_DATABASE, and SNOWFLAKE_WAREHOUSE environment variables."
    );
  }

  snowflakeClient = new SnowflakeClient({
    account,
    username,
    password,
    database,
    warehouse,
    role,
  });

  return snowflakeClient;
}

export { SnowflakeClient };
export type { AggregatedAdsData, CampaignData, AdMetrics };
