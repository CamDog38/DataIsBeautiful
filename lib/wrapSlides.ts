import data from "../data/wrap-data.json";
import ecommData from "../data/ecomm-wrap-data.json";
import { buildHeatmapLayout, getHeatmapData } from "./heatmap";

export type SlideType =
  | "intro"
  | "bigNumber"
  | "topList"
  | "barTimeline"
  | "heatmap"
  | "peakHour"
  | "geoHotspots"
  | "funnel"
  | "customerLoyalty"
  | "cartRecovery"
  | "seasonalPeak"
  | "aovGrowth"
  | "topCustomer"
  | "fastestSelling"
  | "reviews"
  | "totalRevenue"
  | "ordersCount"
  | "refundRate"
  | "discountUsage"
  | "topProducts"
  | "productPerformance"
  | "inventoryTurnover"
  | "customerLifetimeValue"
  | "topReferrers"
  | "fulfillmentSpeed"
  // Ads slide types
  | "adSpendRevenue"
  | "adSpendLeads"
  | "channelComparison"
  | "channelLeads"
  | "campaignPerformance"
  | "campaignLeads"
  | "adMetricsGrid"
  | "creativeWins"
  | "efficiencyTrends"
  | "channelShowdown"
  | "milestones"
  | "optimizationWins"
  // Social Media slide types
  | "followerGrowth"
  | "engagementDonut"
  | "topPosts"
  | "audienceDemographics"
  | "impressionsReach"
  | "contentPerformance"
  | "socialMilestone"
  | "bestPostingTime"
  | "recap";

export type Slide = {
  id: string;
  type: SlideType;
  title: string;
  subtitle?: string;
  payload?: any;
};

export type WrapData = typeof data;

export function getWrapData(): WrapData {
  return data;
}

export function buildSlides(d: WrapData): Slide[] {
  const { user, year, summary, activityByMonth, topItems } = d;

  const busiest = activityByMonth.reduce((max, m) =>
    m.views > max.views ? m : max
  );

  const heatmapTiles = buildHeatmapLayout(getHeatmapData());

  return [
    // Intro
    {
      id: "intro",
      type: "intro",
      title: `${user.name}'s ${year} E-commerce Wrapped`,
      subtitle: "Your year in sales, customers, and growth.",
    },
    // 1. Total Revenue - The big headline
    {
      id: "total-revenue",
      type: "totalRevenue",
      title: "Your total revenue",
      subtitle: "Every sale, every transaction, every win.",
      payload: ecommData.totalRevenue,
    },
    // 2. Orders Count
    {
      id: "orders-count",
      type: "ordersCount",
      title: "Orders fulfilled",
      subtitle: "Each one a customer made happy.",
      payload: ecommData.ordersCount,
    },
    // 3. Refund Rate
    {
      id: "refund-rate",
      type: "refundRate",
      title: "Your refund rate",
      subtitle: "Lower is better—and you're crushing it.",
      payload: ecommData.refundRate,
    },
    // 4. Discount Usage
    {
      id: "discount-usage",
      type: "discountUsage",
      title: "Discount codes in action",
      subtitle: "Your promotions drove serious revenue.",
      payload: ecommData.discountUsage,
    },
    // 5. Top Products
    {
      id: "top-products",
      type: "topProducts",
      title: "Your bestsellers",
      subtitle: "The products your customers couldn't resist.",
      payload: ecommData.topProducts,
    },
    // 6. Inventory Turnover
    {
      id: "inventory-turnover",
      type: "inventoryTurnover",
      title: "Inventory turnover",
      subtitle: "How fast your products fly off the shelves.",
      payload: ecommData.inventoryTurnover,
    },
    // 9. Customer Lifetime Value
    {
      id: "customer-ltv",
      type: "customerLifetimeValue",
      title: "Customer lifetime value",
      subtitle: "What each customer is worth to your business.",
      payload: ecommData.customerLifetimeValue,
    },
    // 12. Top Referrers
    {
      id: "top-referrers",
      type: "topReferrers",
      title: "Where your traffic came from",
      subtitle: "The channels driving your growth.",
      payload: ecommData.topReferrers,
    },
    // 14. Fulfillment Speed
    {
      id: "fulfillment-speed",
      type: "fulfillmentSpeed",
      title: "Fulfillment speed",
      subtitle: "Getting orders out the door, fast.",
      payload: ecommData.fulfillmentSpeed,
    },
    // Peak Hour
    {
      id: "peak-hour",
      type: "peakHour",
      title: "When your customers shop",
      subtitle: "Your store was busiest in the early afternoon.",
      payload: ecommData.peakHour,
    },
    // Geo Hotspots
    {
      id: "geo-hotspots",
      type: "geoHotspots",
      title: "Your top markets",
      subtitle: "Where your customers are coming from.",
      payload: ecommData.geoHotspots,
    },
    // Funnel
    {
      id: "funnel",
      type: "funnel",
      title: "The customer journey",
      subtitle: "From first visit to purchase.",
      payload: ecommData.funnel,
    },
    // Customer Loyalty
    {
      id: "customer-loyalty",
      type: "customerLoyalty",
      title: "Customer loyalty",
      subtitle: "Your returning customers are your biggest fans.",
      payload: ecommData.customerLoyalty,
    },
    // Cart Recovery
    {
      id: "cart-recovery",
      type: "cartRecovery",
      title: "Cart recovery wins",
      subtitle: "Every recovered cart is a second chance.",
      payload: ecommData.cartRecovery,
    },
    // Seasonal Peak
    {
      id: "seasonal-peak",
      type: "seasonalPeak",
      title: "Your biggest day",
      subtitle: "When the sales went through the roof.",
      payload: ecommData.seasonalPeak,
    },
    // AOV Growth
    {
      id: "aov-growth",
      type: "aovGrowth",
      title: "Average order value",
      subtitle: "Your customers are spending more per order.",
      payload: ecommData.aovGrowth,
    },
    // Top Customer
    {
      id: "top-customer",
      type: "topCustomer",
      title: "Your #1 customer",
      subtitle: "A true superfan (anonymized for privacy).",
      payload: ecommData.topCustomer,
    },
    // Fastest Selling
    {
      id: "fastest-selling",
      type: "fastestSelling",
      title: "Fastest sellout",
      subtitle: "This product flew off the shelves.",
      payload: ecommData.fastestSelling,
    },
    // Reviews
    {
      id: "reviews",
      type: "reviews",
      title: "What customers said",
      subtitle: "The voice of your community.",
      payload: ecommData.reviews,
    },
    // Revenue Heatmap
    {
      id: "ecomm-heatmap",
      type: "heatmap",
      title: "Where your revenue came from",
      subtitle: "Each tile shows a category's share of revenue and its daily change.",
      payload: { tiles: heatmapTiles },
    },
    // Recap
    {
      id: "recap",
      type: "recap",
      title: "That was your year.",
      subtitle: "Ready to make the next one even bigger?",
      payload: { handle: user.handle },
    },
  ];
}
