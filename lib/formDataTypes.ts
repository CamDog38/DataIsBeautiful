// E-commerce Form Data - matches slide payloads exactly
export interface EcommFormData {
  // User info
  userName: string;
  year: string;
  currencyCode: string;

  // Total Revenue slide
  totalRevenue: string;
  previousYearRevenue: string;
  revenueGrowthPercent: string;

  // Orders Count slide
  totalOrders: string;
  previousYearOrders: string;
  ordersGrowthPercent: string;
  averageOrdersPerDay: string;

  // Refund Rate slide
  totalRefunds: string;
  refundRate: string;
  refundAmount: string;
  industryAverageRefundRate: string;
  refundReason1: string;
  refundReason1Percent: string;
  refundReason2: string;
  refundReason2Percent: string;
  refundReason3: string;
  refundReason3Percent: string;

  // Discount Usage slide
  totalDiscountedOrders: string;
  discountedOrdersPercent: string;
  totalDiscountAmount: string;
  discountCode1: string;
  discountCode1Uses: string;
  discountCode1Revenue: string;
  discountCode2: string;
  discountCode2Uses: string;
  discountCode2Revenue: string;
  discountCode3: string;
  discountCode3Uses: string;
  discountCode3Revenue: string;

  // Top Products slide
  topProduct1Name: string;
  topProduct1Revenue: string;
  topProduct1Units: string;
  topProduct2Name: string;
  topProduct2Revenue: string;
  topProduct2Units: string;
  topProduct3Name: string;
  topProduct3Revenue: string;
  topProduct3Units: string;
  topProduct4Name: string;
  topProduct4Revenue: string;
  topProduct4Units: string;
  topProduct5Name: string;
  topProduct5Revenue: string;
  topProduct5Units: string;

  // Inventory Turnover slide
  averageTurnover: string;
  industryAverageTurnover: string;
  totalSkus: string;
  fastMovers: string;
  slowMovers: string;
  outOfStockEvents: string;

  // Customer Lifetime Value slide
  averageCLV: string;
  previousYearCLV: string;
  clvGrowthPercent: string;
  vipCustomers: string;
  vipCLV: string;
  loyalCustomers: string;
  loyalCLV: string;

  // Top Referrers slide
  referrer1Source: string;
  referrer1Visitors: string;
  referrer1Revenue: string;
  referrer1ConversionRate: string;
  referrer2Source: string;
  referrer2Visitors: string;
  referrer2Revenue: string;
  referrer2ConversionRate: string;
  referrer3Source: string;
  referrer3Visitors: string;
  referrer3Revenue: string;
  referrer3ConversionRate: string;

  // Fulfillment Speed slide
  averageFulfillmentHours: string;
  previousYearFulfillmentHours: string;
  fulfillmentImprovementPercent: string;
  sameDayPercent: string;
  nextDayPercent: string;
  twoPlusDayPercent: string;
  onTimeRate: string;

  // Peak Hour slide
  peakHour: string;
  peakHourLabel: string;
  salesAtPeak: string;

  // Geo Hotspots slide
  topRegion: string;
  topRegionSales: string;
  region2Name: string;
  region2Sales: string;
  region3Name: string;
  region3Sales: string;
  region4Name: string;
  region4Sales: string;
  region5Name: string;
  region5Sales: string;

  // Funnel slide
  funnelVisitors: string;
  funnelProductViews: string;
  funnelAddedToCart: string;
  funnelCheckout: string;
  funnelPurchased: string;

  // Customer Loyalty slide
  newCustomers: string;
  returningCustomers: string;
  newRevenue: string;
  returningRevenue: string;

  // Cart Recovery slide
  abandonedCarts: string;
  recoveredCarts: string;
  recoveredRevenue: string;
  recoveryRate: string;

  // Seasonal Peak slide
  peakDay: string;
  peakDate: string;
  peakDayRevenue: string;
  averageDayRevenue: string;

  // AOV Growth slide
  startAov: string;
  endAov: string;
  aovGrowthPercent: string;

  // Top Customer slide
  topCustomerOrderCount: string;
  topCustomerTotalSpent: string;
  topCustomerMemberSince: string;
  topCustomerFavoriteCategory: string;

  // Fastest Selling slide
  fastestSellingProduct: string;
  fastestSellingSoldOutTime: string;
  fastestSellingUnitsSold: string;
  fastestSellingLaunchDate: string;

  // Reviews slide
  totalReviews: string;
  fiveStarCount: string;
  averageRating: string;
  topReviewWord1: string;
  topReviewWord2: string;
  topReviewWord3: string;
}

export const initialEcommFormData: EcommFormData = {
  userName: "",
  year: new Date().getFullYear().toString(),
  currencyCode: "USD",
  totalRevenue: "",
  previousYearRevenue: "",
  revenueGrowthPercent: "",
  totalOrders: "",
  previousYearOrders: "",
  ordersGrowthPercent: "",
  averageOrdersPerDay: "",
  totalRefunds: "",
  refundRate: "",
  refundAmount: "",
  industryAverageRefundRate: "8.5",
  refundReason1: "",
  refundReason1Percent: "",
  refundReason2: "",
  refundReason2Percent: "",
  refundReason3: "",
  refundReason3Percent: "",
  totalDiscountedOrders: "",
  discountedOrdersPercent: "",
  totalDiscountAmount: "",
  discountCode1: "",
  discountCode1Uses: "",
  discountCode1Revenue: "",
  discountCode2: "",
  discountCode2Uses: "",
  discountCode2Revenue: "",
  discountCode3: "",
  discountCode3Uses: "",
  discountCode3Revenue: "",
  topProduct1Name: "",
  topProduct1Revenue: "",
  topProduct1Units: "",
  topProduct2Name: "",
  topProduct2Revenue: "",
  topProduct2Units: "",
  topProduct3Name: "",
  topProduct3Revenue: "",
  topProduct3Units: "",
  topProduct4Name: "",
  topProduct4Revenue: "",
  topProduct4Units: "",
  topProduct5Name: "",
  topProduct5Revenue: "",
  topProduct5Units: "",
  averageTurnover: "",
  industryAverageTurnover: "6.2",
  totalSkus: "",
  fastMovers: "",
  slowMovers: "",
  outOfStockEvents: "",
  averageCLV: "",
  previousYearCLV: "",
  clvGrowthPercent: "",
  vipCustomers: "",
  vipCLV: "",
  loyalCustomers: "",
  loyalCLV: "",
  referrer1Source: "",
  referrer1Visitors: "",
  referrer1Revenue: "",
  referrer1ConversionRate: "",
  referrer2Source: "",
  referrer2Visitors: "",
  referrer2Revenue: "",
  referrer2ConversionRate: "",
  referrer3Source: "",
  referrer3Visitors: "",
  referrer3Revenue: "",
  referrer3ConversionRate: "",
  averageFulfillmentHours: "",
  previousYearFulfillmentHours: "",
  fulfillmentImprovementPercent: "",
  sameDayPercent: "",
  nextDayPercent: "",
  twoPlusDayPercent: "",
  onTimeRate: "",
  peakHour: "",
  peakHourLabel: "",
  salesAtPeak: "",
  topRegion: "",
  topRegionSales: "",
  region2Name: "",
  region2Sales: "",
  region3Name: "",
  region3Sales: "",
  region4Name: "",
  region4Sales: "",
  region5Name: "",
  region5Sales: "",
  funnelVisitors: "",
  funnelProductViews: "",
  funnelAddedToCart: "",
  funnelCheckout: "",
  funnelPurchased: "",
  newCustomers: "",
  returningCustomers: "",
  newRevenue: "",
  returningRevenue: "",
  abandonedCarts: "",
  recoveredCarts: "",
  recoveredRevenue: "",
  recoveryRate: "",
  peakDay: "",
  peakDate: "",
  peakDayRevenue: "",
  averageDayRevenue: "",
  startAov: "",
  endAov: "",
  aovGrowthPercent: "",
  topCustomerOrderCount: "",
  topCustomerTotalSpent: "",
  topCustomerMemberSince: "",
  topCustomerFavoriteCategory: "",
  fastestSellingProduct: "",
  fastestSellingSoldOutTime: "",
  fastestSellingUnitsSold: "",
  fastestSellingLaunchDate: "",
  totalReviews: "",
  fiveStarCount: "",
  averageRating: "",
  topReviewWord1: "",
  topReviewWord2: "",
  topReviewWord3: "",
};

// Helper to parse numbers from form strings
export function parseNum(val: string): number {
  if (!val) return 0;
  // Remove anything that's not a digit, decimal point, or minus sign
  const cleaned = val.replace(/[^0-9.\-]/g, "");
  return parseFloat(cleaned) || 0;
}

// Storage keys
export const ECOMM_FORM_STORAGE_KEY = "ecomm-wrapped-form-data";
export const SOCIAL_FORM_STORAGE_KEY = "social-wrapped-form-data";
export const ADS_FORM_STORAGE_KEY = "ads-wrapped-form-data";

// Ads Form Data
export interface AdsFormData {
  customerName: string;
  currencyCode: string;
  totalAdSpend: string;
  revenueAttributed: string;
  blendedRoas: string;
  totalConversions: string;
  totalImpressions: string;
  totalClicks: string;
  topChannelBySpend: string;
  spendOnTopChannel: string;
  topChannelRoas: string;
  secondChannel: string;
  spendOnSecondChannel: string;
  secondChannelRoas: string;
  bestRoasChannel: string;
  bestRoasChannelPerformance: string;
  topCampaign1Name: string;
  topCampaign1Revenue: string;
  topCampaign1Roas: string;
  topCampaign1Spend: string;
  topCampaign2Name: string;
  topCampaign2Revenue: string;
  mostEfficientCampaign: string;
  mostEfficientCampaignRoas: string;
  topCreative1Description: string;
  topCreative1Performance: string;
  topCreative2Description: string;
  topCreative2Performance: string;
  bestPerformingFormat: string;
  bestHookAngle: string;
  totalCreativesTested: string;
  creativeWinRate: string;
  averageCpm: string;
  averageCpc: string;
  averageCpa: string;
  averageCtr: string;
  bestMonthForEfficiency: string;
  bestMonthCpa: string;
  yoyCpaChange: string;
  yoyRoasChange: string;
}

// Social Form Data
export interface SocialFormData {
  customerName: string;
  currencyCode: string;
  startingFollowers: string;
  endingFollowers: string;
  totalImpressions: string;
  totalReach: string;
  totalPostsPublished: string;
  primaryPlatform: string;
  totalLikes: string;
  totalComments: string;
  totalShares: string;
  totalSaves: string;
  avgEngagementRate: string;
  bestEngagementDay: string;
  topPost1Description: string;
  topPost1Metrics: string;
  topPost1Url: string;        // NEW: Link to post
  topPost1Likes: string;      // NEW: Likes count
  topPost1Comments: string;   // NEW: Comments count
  topPost2Description: string;
  topPost2Metrics: string;
  topPost2Url: string;        // NEW: Link to post
  topPost2Likes: string;      // NEW: Likes count
  topPost2Comments: string;   // NEW: Comments count
  topPost3Description: string; // NEW: Third top post
  topPost3Metrics: string;
  topPost3Url: string;
  topPost3Likes: string;
  topPost3Comments: string;
  bestPerformingFormat: string;
  mostViralPostReach: string;
  topHashtag: string;
  bestCampaign: string;
  topAgeRange: string;
  genderSplit: string;
  topCountry: string;
  topCity: string;
  peakActiveHours: string;
  audienceInterests: string;
  netNewFollowers: string;
  growthRate: string;
  bestGrowthMonth: string;
  milestoneReached: string;
  notableCollaborations: string;
  newPlatformLaunched: string;
  // Monthly follower data for chart
  monthlyFollowers: string; // JSON string of monthly data e.g. "Jan:1000,Feb:1200,..."
}
