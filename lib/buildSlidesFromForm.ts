import { Slide } from "./wrapSlides";
import { EcommFormData, AdsFormData, SocialFormData, parseNum } from "./formDataTypes";
import type { AggregatedAdsData } from "./adsDataTypes";
import { getMonthName } from "./adsDataTypes";

// Helper to get currency symbol from ISO code
function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
    ZAR: "R",
    AUD: "A$",
    CAD: "C$",
  };
  return symbols[code] || "$";
}

export function buildEcommSlidesFromForm(form: EcommFormData): Slide[] {
  const slides: Slide[] = [];

  // Intro
  slides.push({
    id: "intro",
    type: "intro",
    title: `${form.userName || "Your"}'s ${form.year} E-commerce Wrapped`,
    subtitle: "Your year in sales, customers, and growth.",
  });

  // Total Revenue
  if (form.totalRevenue) {
    slides.push({
      id: "total-revenue",
      type: "totalRevenue",
      title: "Your total revenue",
      subtitle: "Every sale, every transaction, every win.",
      payload: {
        amount: parseNum(form.totalRevenue),
        previousYear: parseNum(form.previousYearRevenue),
        growthPercent: parseNum(form.revenueGrowthPercent),
        currency: form.currencyCode || "USD",
      },
    });
  }

  // Orders Count
  if (form.totalOrders) {
    slides.push({
      id: "orders-count",
      type: "ordersCount",
      title: "Orders fulfilled",
      subtitle: "Each one a customer made happy.",
      payload: {
        total: parseNum(form.totalOrders),
        previousYear: parseNum(form.previousYearOrders),
        growthPercent: parseNum(form.ordersGrowthPercent),
        averagePerDay: parseNum(form.averageOrdersPerDay),
      },
    });
  }

  // Refund Rate
  if (form.refundRate) {
    const topReasons = [];
    if (form.refundReason1) {
      topReasons.push({ reason: form.refundReason1, percent: parseNum(form.refundReason1Percent) });
    }
    if (form.refundReason2) {
      topReasons.push({ reason: form.refundReason2, percent: parseNum(form.refundReason2Percent) });
    }
    if (form.refundReason3) {
      topReasons.push({ reason: form.refundReason3, percent: parseNum(form.refundReason3Percent) });
    }

    slides.push({
      id: "refund-rate",
      type: "refundRate",
      title: "Your refund rate",
      subtitle: "Lower is better—and you're crushing it.",
      payload: {
        totalRefunds: parseNum(form.totalRefunds),
        refundRate: parseNum(form.refundRate),
        refundAmount: parseNum(form.refundAmount),
        industryAverage: parseNum(form.industryAverageRefundRate),
        topReasons,
      },
    });
  }

  // Discount Usage
  if (form.discountCode1) {
    const topCodes = [];
    if (form.discountCode1) {
      topCodes.push({
        code: form.discountCode1,
        uses: parseNum(form.discountCode1Uses),
        revenue: parseNum(form.discountCode1Revenue),
      });
    }
    if (form.discountCode2) {
      topCodes.push({
        code: form.discountCode2,
        uses: parseNum(form.discountCode2Uses),
        revenue: parseNum(form.discountCode2Revenue),
      });
    }
    if (form.discountCode3) {
      topCodes.push({
        code: form.discountCode3,
        uses: parseNum(form.discountCode3Uses),
        revenue: parseNum(form.discountCode3Revenue),
      });
    }

    slides.push({
      id: "discount-usage",
      type: "discountUsage",
      title: "Discount codes in action",
      subtitle: "Your promotions drove serious revenue.",
      payload: {
        totalDiscountedOrders: parseNum(form.totalDiscountedOrders),
        discountedOrdersPercent: parseNum(form.discountedOrdersPercent),
        totalDiscountAmount: parseNum(form.totalDiscountAmount),
        averageDiscountPercent: 15,
        topCodes,
      },
    });
  }

  // Top Products
  if (form.topProduct1Name) {
    const products = [];
    const emojis = ["📱", "👕", "🎧", "🏠", "⌚"];
    if (form.topProduct1Name) {
      products.push({
        name: form.topProduct1Name,
        sku: "SKU-001",
        revenue: parseNum(form.topProduct1Revenue),
        units: parseNum(form.topProduct1Units),
        image: emojis[0],
      });
    }
    if (form.topProduct2Name) {
      products.push({
        name: form.topProduct2Name,
        sku: "SKU-002",
        revenue: parseNum(form.topProduct2Revenue),
        units: parseNum(form.topProduct2Units),
        image: emojis[1],
      });
    }
    if (form.topProduct3Name) {
      products.push({
        name: form.topProduct3Name,
        sku: "SKU-003",
        revenue: parseNum(form.topProduct3Revenue),
        units: parseNum(form.topProduct3Units),
        image: emojis[2],
      });
    }
    if (form.topProduct4Name) {
      products.push({
        name: form.topProduct4Name,
        sku: "SKU-004",
        revenue: parseNum(form.topProduct4Revenue),
        units: parseNum(form.topProduct4Units),
        image: emojis[3],
      });
    }
    if (form.topProduct5Name) {
      products.push({
        name: form.topProduct5Name,
        sku: "SKU-005",
        revenue: parseNum(form.topProduct5Revenue),
        units: parseNum(form.topProduct5Units),
        image: emojis[4],
      });
    }

    slides.push({
      id: "top-products",
      type: "topProducts",
      title: "Your bestsellers",
      subtitle: "The products your customers couldn't resist.",
      payload: { products },
    });
  }

  // Inventory Turnover
  if (form.averageTurnover) {
    slides.push({
      id: "inventory-turnover",
      type: "inventoryTurnover",
      title: "Inventory turnover",
      subtitle: "How fast your products fly off the shelves.",
      payload: {
        averageTurnover: parseNum(form.averageTurnover),
        industryAverage: parseNum(form.industryAverageTurnover),
        totalSkus: parseNum(form.totalSkus),
        fastMovers: parseNum(form.fastMovers),
        slowMovers: parseNum(form.slowMovers),
        outOfStockEvents: parseNum(form.outOfStockEvents),
        categories: [],
      },
    });
  }

  // Customer Lifetime Value
  if (form.averageCLV) {
    const segments = [];
    if (form.vipCustomers) {
      segments.push({
        name: "VIP",
        clv: parseNum(form.vipCLV),
        customers: parseNum(form.vipCustomers),
        percent: 3,
      });
    }
    if (form.loyalCustomers) {
      segments.push({
        name: "Loyal",
        clv: parseNum(form.loyalCLV),
        customers: parseNum(form.loyalCustomers),
        percent: 15,
      });
    }

    slides.push({
      id: "customer-ltv",
      type: "customerLifetimeValue",
      title: "Customer lifetime value",
      subtitle: "What each customer is worth to your business.",
      payload: {
        averageCLV: parseNum(form.averageCLV),
        previousYear: parseNum(form.previousYearCLV),
        growthPercent: parseNum(form.clvGrowthPercent),
        topTierCLV: parseNum(form.vipCLV),
        segments,
      },
    });
  }

  // Top Referrers
  if (form.referrer1Source) {
    const referrers = [];
    const icons = ["🔍", "📸", "📘", "🎵", "📧", "🔗"];
    if (form.referrer1Source) {
      referrers.push({
        source: form.referrer1Source,
        visitors: parseNum(form.referrer1Visitors),
        revenue: parseNum(form.referrer1Revenue),
        conversionRate: parseNum(form.referrer1ConversionRate),
        icon: icons[0],
      });
    }
    if (form.referrer2Source) {
      referrers.push({
        source: form.referrer2Source,
        visitors: parseNum(form.referrer2Visitors),
        revenue: parseNum(form.referrer2Revenue),
        conversionRate: parseNum(form.referrer2ConversionRate),
        icon: icons[1],
      });
    }
    if (form.referrer3Source) {
      referrers.push({
        source: form.referrer3Source,
        visitors: parseNum(form.referrer3Visitors),
        revenue: parseNum(form.referrer3Revenue),
        conversionRate: parseNum(form.referrer3ConversionRate),
        icon: icons[2],
      });
    }

    slides.push({
      id: "top-referrers",
      type: "topReferrers",
      title: "Where your traffic came from",
      subtitle: "The channels driving your growth.",
      payload: { referrers },
    });
  }

  // Fulfillment Speed
  if (form.averageFulfillmentHours) {
    slides.push({
      id: "fulfillment-speed",
      type: "fulfillmentSpeed",
      title: "Fulfillment speed",
      subtitle: "Getting orders out the door, fast.",
      payload: {
        averageHours: parseNum(form.averageFulfillmentHours),
        previousYear: parseNum(form.previousYearFulfillmentHours),
        improvementPercent: parseNum(form.fulfillmentImprovementPercent),
        sameDay: parseNum(form.sameDayPercent),
        nextDay: parseNum(form.nextDayPercent),
        twoPlusDay: parseNum(form.twoPlusDayPercent),
        onTimeRate: parseNum(form.onTimeRate),
        monthlyTrend: [],
      },
    });
  }

  // Peak Hour
  if (form.peakHour) {
    slides.push({
      id: "peak-hour",
      type: "peakHour",
      title: "When your customers shop",
      subtitle: "Your store was busiest in the early afternoon.",
      payload: {
        hour: parseNum(form.peakHour),
        hourLabel: form.peakHourLabel || `${form.peakHour}:00`,
        salesAtPeak: parseNum(form.salesAtPeak),
        hourlyBreakdown: [],
      },
    });
  }

  // Geo Hotspots
  if (form.topRegion) {
    const regions = [];
    if (form.topRegion) {
      regions.push({ name: form.topRegion, sales: parseNum(form.topRegionSales), orders: 0 });
    }
    if (form.region2Name) {
      regions.push({ name: form.region2Name, sales: parseNum(form.region2Sales), orders: 0 });
    }
    if (form.region3Name) {
      regions.push({ name: form.region3Name, sales: parseNum(form.region3Sales), orders: 0 });
    }
    if (form.region4Name) {
      regions.push({ name: form.region4Name, sales: parseNum(form.region4Sales), orders: 0 });
    }
    if (form.region5Name) {
      regions.push({ name: form.region5Name, sales: parseNum(form.region5Sales), orders: 0 });
    }

    slides.push({
      id: "geo-hotspots",
      type: "geoHotspots",
      title: "Your top markets",
      subtitle: "Where your customers are coming from.",
      payload: {
        topRegion: form.topRegion,
        topRegionSales: parseNum(form.topRegionSales),
        regions,
      },
    });
  }

  // Funnel
  if (form.funnelVisitors) {
    slides.push({
      id: "funnel",
      type: "funnel",
      title: "The customer journey",
      subtitle: "From first visit to purchase.",
      payload: {
        visitors: parseNum(form.funnelVisitors),
        productViews: parseNum(form.funnelProductViews),
        addedToCart: parseNum(form.funnelAddedToCart),
        checkout: parseNum(form.funnelCheckout),
        purchased: parseNum(form.funnelPurchased),
      },
    });
  }

  // Customer Loyalty
  if (form.newCustomers) {
    const returningRevenue = parseNum(form.returningRevenue);
    const newRevenue = parseNum(form.newRevenue);
    const total = returningRevenue + newRevenue;

    slides.push({
      id: "customer-loyalty",
      type: "customerLoyalty",
      title: "Customer loyalty",
      subtitle: "Your returning customers are your biggest fans.",
      payload: {
        newCustomers: parseNum(form.newCustomers),
        returningCustomers: parseNum(form.returningCustomers),
        newRevenue,
        returningRevenue,
        returningRevenuePercent: total > 0 ? Math.round((returningRevenue / total) * 100) : 0,
      },
    });
  }

  // Cart Recovery
  if (form.abandonedCarts) {
    slides.push({
      id: "cart-recovery",
      type: "cartRecovery",
      title: "Cart recovery wins",
      subtitle: "Every recovered cart is a second chance.",
      payload: {
        abandonedCarts: parseNum(form.abandonedCarts),
        recoveredCarts: parseNum(form.recoveredCarts),
        recoveredRevenue: parseNum(form.recoveredRevenue),
        recoveryRate: parseNum(form.recoveryRate),
      },
    });
  }

  // Seasonal Peak
  if (form.peakDay) {
    const peakRevenue = parseNum(form.peakDayRevenue);
    const avgRevenue = parseNum(form.averageDayRevenue);

    slides.push({
      id: "seasonal-peak",
      type: "seasonalPeak",
      title: "Your biggest day",
      subtitle: "When the sales went through the roof.",
      payload: {
        peakDay: form.peakDay,
        peakDate: form.peakDate,
        peakRevenue,
        averageDayRevenue: avgRevenue,
        multiplier: avgRevenue > 0 ? Math.round((peakRevenue / avgRevenue) * 10) / 10 : 0,
        dailyData: [],
      },
    });
  }

  // AOV Growth
  if (form.startAov) {
    slides.push({
      id: "aov-growth",
      type: "aovGrowth",
      title: "Average order value",
      subtitle: "Your customers are spending more per order.",
      payload: {
        startAov: parseNum(form.startAov),
        endAov: parseNum(form.endAov),
        growthPercent: parseNum(form.aovGrowthPercent),
        monthlyAov: [],
      },
    });
  }

  // Top Customer
  if (form.topCustomerOrderCount) {
    slides.push({
      id: "top-customer",
      type: "topCustomer",
      title: "Your #1 customer",
      subtitle: "A true superfan (anonymized for privacy).",
      payload: {
        orderCount: parseNum(form.topCustomerOrderCount),
        totalSpent: parseNum(form.topCustomerTotalSpent),
        memberSince: form.topCustomerMemberSince,
        favoriteCategory: form.topCustomerFavoriteCategory,
      },
    });
  }

  // Fastest Selling
  if (form.fastestSellingProduct) {
    slides.push({
      id: "fastest-selling",
      type: "fastestSelling",
      title: "Fastest sellout",
      subtitle: "This product flew off the shelves.",
      payload: {
        productName: form.fastestSellingProduct,
        soldOutTime: form.fastestSellingSoldOutTime,
        unitsSold: parseNum(form.fastestSellingUnitsSold),
        launchDate: form.fastestSellingLaunchDate,
      },
    });
  }

  // Reviews
  if (form.totalReviews) {
    const topWords = [];
    if (form.topReviewWord1) topWords.push({ word: form.topReviewWord1, count: 100 });
    if (form.topReviewWord2) topWords.push({ word: form.topReviewWord2, count: 80 });
    if (form.topReviewWord3) topWords.push({ word: form.topReviewWord3, count: 60 });

    slides.push({
      id: "reviews",
      type: "reviews",
      title: "What customers said",
      subtitle: "The voice of your community.",
      payload: {
        totalReviews: parseNum(form.totalReviews),
        fiveStarCount: parseNum(form.fiveStarCount),
        averageRating: parseNum(form.averageRating),
        topWords,
      },
    });
  }

  // Recap
  slides.push({
    id: "recap",
    type: "recap",
    title: "That was your year.",
    subtitle: "Ready to make the next one even bigger?",
    payload: { handle: form.userName || "you" },
  });

  return slides;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADS WRAPPED SLIDES
// ─────────────────────────────────────────────────────────────────────────────

export function buildAdsSlidesFromForm(form: AdsFormData, aggregatedData?: AggregatedAdsData): Slide[] {
  const slides: Slide[] = [];

  const spend = parseNum(form.totalAdSpend);
  const revenue = parseNum(form.revenueAttributed);
  const results = parseNum(form.totalConversions);
  const currency = form.currencyCode || "USD";

  const roas = revenue > 0 && spend > 0
    ? revenue / spend
    : parseNum(form.blendedRoas);

  const periodType = form.periodType || "year";
  const selectedYear = form.periodYear || new Date().getFullYear().toString();
  const selectedMonth = form.periodMonth || "";
  const periodLabel =
    periodType === "custom" && form.periodStartDate && form.periodEndDate
      ? `${form.periodStartDate} – ${form.periodEndDate}`
      : periodType === "month" && selectedMonth
        ? selectedMonth
        : selectedYear;

  // Intro
  slides.push({
    id: "intro",
    type: "intro",
    title: `${form.customerName || "Your"}'s ${periodLabel} Wrapped`,
    subtitle:
      periodType === "month"
        ? "Your month in paid media performance."
        : periodType === "custom"
          ? "Your paid media performance for the selected period."
          : "Your year in paid media performance.",
  });

  // 1. Ad Spend Overview - show spend and revenue when available, otherwise spend and results/CPR
  if (form.totalAdSpend) {
    const cpr = results > 0 ? spend / results : 0;

    if (revenue > 0) {
      slides.push({
        id: "spend-revenue",
        type: "adSpendRevenue",
        title: "Your Ad Investment",
        subtitle: "What you spent vs what you earned.",
        payload: {
          spend,
          revenue,
          roas,
          currency,
        },
      });
    } else if (results > 0) {
      slides.push({
        id: "spend-leads",
        type: "adSpendLeads",
        title: "Your Ad Investment",
        subtitle: "What you spent and what you generated.",
        payload: {
          spend,
          // These represent total results and cost per result
          leads: results,
          cpl: cpr,
          currency,
        },
      });
    }
  }

  // 2. Channel Comparison (bar chart)
  if (form.topChannelBySpend) {
    const channels = [];
    const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
    
    if (form.topChannelBySpend) {
      channels.push({
        name: form.topChannelBySpend,
        spend: parseNum(form.spendOnTopChannel),
        revenue: parseNum(form.spendOnTopChannel) * parseNum(form.topChannelRoas),
        roas: parseNum(form.topChannelRoas),
        color: colors[0],
      });
    }
    if (form.secondChannel) {
      channels.push({
        name: form.secondChannel,
        spend: parseNum(form.spendOnSecondChannel),
        revenue: parseNum(form.spendOnSecondChannel) * parseNum(form.secondChannelRoas),
        roas: parseNum(form.secondChannelRoas),
        color: colors[1],
      });
    }
    if (form.bestRoasChannel && form.bestRoasChannel !== form.topChannelBySpend && form.bestRoasChannel !== form.secondChannel) {
      channels.push({
        name: form.bestRoasChannel,
        spend: spend * 0.15, // Estimate if not provided
        revenue: spend * 0.15 * parseNum(form.bestRoasChannelPerformance),
        roas: parseNum(form.bestRoasChannelPerformance),
        color: colors[2],
      });
    }

    slides.push({
      id: "channel-comparison",
      type: "channelComparison",
      title: "Channel Performance",
      subtitle: "Where your ad dollars worked hardest.",
      payload: {
        channels,
        metric: "spend",
        currency,
      },
    });
  }

  // 3. Campaign Performance (top campaigns by results & CPR)
  const topCampaignsByRevenue = aggregatedData?.topCampaignsByRevenue || [];
  if (aggregatedData && topCampaignsByRevenue.length > 0) {
    // Use aggregated campaign data from manual imports, but rank by results
    const campaignsSource = [...topCampaignsByRevenue].sort((a, b) => b.results - a.results);
    const topCampaigns = campaignsSource.slice(0, 4);
    const mostEfficient = aggregatedData.mostEfficientCampaign || null;

    const campaigns = topCampaigns.map((c, index) => ({
      name: c.name,
      spend: c.spend,
      results: c.results,
      impressions: c.impressions,
      cpr: c.cpr,
      primaryResultTypeName: c.primaryResultTypeName,
      isTopPerformer: index === 0,
      isMostEfficient: mostEfficient ? c.id === mostEfficient.id : false,
    }));

    const totalSpendTop = topCampaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalResultsTop = topCampaigns.reduce((sum, c) => sum + c.results, 0);
    const totalImpressionsTop = topCampaigns.reduce((sum, c) => sum + c.impressions, 0);

    slides.push({
      id: "campaign-performance",
      type: "campaignPerformance",
      title: "Top Campaigns Overall",
      subtitle: "The campaigns that drove results.",
      payload: {
        campaigns,
        totalSpend: totalSpendTop,
        totalResults: totalResultsTop,
        totalImpressions: totalImpressionsTop,
        currency,
      },
    });
  } else if (aggregatedData && aggregatedData.googleAdsTopCampaigns && aggregatedData.googleAdsTopCampaigns.length > 0) {
    // When using Snowflake-only data, derive "overall" campaigns by combining Google + Meta
    // (when available), then ranking by results.
    const googleSource = (aggregatedData.googleAdsTopCampaigns || []).map((c) => ({
      name: c.campaignName,
      spend: c.spend || 0,
      results: c.conversions || 0,
      impressions: c.impressions || 0,
      cpr: c.costPerResult || 0,
    }));

    const metaSource = ((aggregatedData as any)?.metaAdsTopCampaignsByResults || []).map((c: any) => ({
      name: c.campaignName,
      spend: c.spend || 0,
      results: c.results || 0,
      impressions: c.impressions || 0,
      cpr: c.cpr === null || typeof c.cpr === "undefined" ? 0 : Number(c.cpr) || 0,
    }));

    const combined = [...googleSource, ...metaSource]
      .sort((a, b) => (b.results || 0) - (a.results || 0))
      .slice(0, 4);

    const campaigns = combined.map((c, index) => ({
      name: c.name,
      spend: c.spend,
      results: c.results,
      impressions: c.impressions,
      cpr: c.results > 0 ? (c.cpr || c.spend / c.results) : 0,
      primaryResultTypeName: undefined,
      isTopPerformer: index === 0,
      isMostEfficient: false,
    }));

    const totalSpendTop = combined.reduce((sum, c) => sum + (c.spend || 0), 0);
    const totalResultsTop = combined.reduce((sum, c) => sum + (c.results || 0), 0);
    const totalImpressionsTop = combined.reduce((sum, c) => sum + (c.impressions || 0), 0);

    slides.push({
      id: "campaign-performance",
      type: "campaignPerformance",
      title: "Top Campaigns Overall",
      subtitle: "The campaigns that drove results.",
      payload: {
        campaigns,
        totalSpend: totalSpendTop,
        totalResults: totalResultsTop,
        totalImpressions: totalImpressionsTop,
        currency,
      },
    });
  } else if (form.topCampaign1Name) {
    // Legacy fallback when only manual form fields are available
    const campaigns = [] as any[];

    if (form.topCampaign1Name) {
      campaigns.push({
        name: form.topCampaign1Name,
        spend: parseNum(form.topCampaign1Spend),
        results: 0,
        impressions: 0,
        cpr: 0,
        primaryResultTypeName: undefined,
        isTopPerformer: true,
      });
    }
    if (form.topCampaign2Name) {
      campaigns.push({
        name: form.topCampaign2Name,
        spend: parseNum(form.topCampaign2Revenue) / (parseNum(form.blendedRoas) || 4),
        results: 0,
        impressions: 0,
        cpr: 0,
        primaryResultTypeName: undefined,
      });
    }
    if (form.mostEfficientCampaign) {
      campaigns.push({
        name: form.mostEfficientCampaign,
        spend: spend * 0.1,
        results: 0,
        impressions: 0,
        cpr: 0,
        primaryResultTypeName: undefined,
        isMostEfficient: true,
      });
    }

    slides.push({
      id: "campaign-performance",
      type: "campaignPerformance",
      title: "Top Campaigns Overall",
      subtitle: "The campaigns that drove results.",
      payload: {
        campaigns,
        totalSpend: spend,
        totalResults: results,
        totalImpressions: parseNum(form.totalImpressions),
        currency,
      },
    });
  }

  // 4. Ad Metrics Grid (overall impressions, clicks, results, CTR, CPC, CPR)
  if (form.totalImpressions || form.totalClicks) {
    const impressions = parseNum(form.totalImpressions);
    const clicks = parseNum(form.totalClicks);
    const conversions = parseNum(form.totalConversions);
    const ctr = parseNum(form.averageCtr) || (impressions > 0 ? (clicks / impressions) * 100 : 0);
    const cpc = parseNum(form.averageCpc) || (clicks > 0 ? spend / clicks : 0);
    const cpa = parseNum(form.averageCpa) || (conversions > 0 ? spend / conversions : 0);
    const cpm = parseNum(form.averageCpm) || (impressions > 0 ? (spend / impressions) * 1000 : 0);

    slides.push({
      id: "ad-metrics",
      type: "adMetricsGrid",
      title: "Overall Performance Metrics",
      subtitle: "The numbers behind your success.",
      payload: {
        impressions,
        clicks,
        conversions,
        ctr,
        cpc,
        cpa,
        cpm,
        currency,
      },
    });
  }

  // 5. Creative Wins (best format, top creatives)
  if (form.topCreative1Description || form.bestPerformingFormat) {
    const creatives = [];
    if (form.topCreative1Description) {
      creatives.push({
        description: form.topCreative1Description,
        performance: form.topCreative1Performance,
      });
    }
    if (form.topCreative2Description) {
      creatives.push({
        description: form.topCreative2Description,
        performance: form.topCreative2Performance,
      });
    }

    slides.push({
      id: "creative-wins",
      type: "creativeWins",
      title: "Creative Winners",
      subtitle: "The ads that captured attention.",
      payload: {
        creatives,
        bestFormat: form.bestPerformingFormat,
        bestHook: form.bestHookAngle,
        totalTested: parseNum(form.totalCreativesTested),
        winRate: parseNum(form.creativeWinRate),
      },
    });
  }

  // 6. Channel Showdown (Meta vs Google head-to-head when both exist)
  const channelsData = aggregatedData?.channels || [];
  if (aggregatedData && channelsData.length >= 2) {
    // Find Meta and Google channels
    const metaChannel = channelsData.find(c => c.channel === "meta");
    const googleChannel = channelsData.find(c => c.channel === "google");
    
    if (metaChannel && googleChannel) {
      slides.push({
        id: "channel-showdown",
        type: "channelShowdown",
        title: "Channel Showdown",
        subtitle: "Meta vs Google — head to head.",
        payload: {
          channelA: {
            name: metaChannel.channelName,
            spend: metaChannel.spend,
            impressions: metaChannel.impressions,
            clicks: metaChannel.clicks,
            ctr: metaChannel.ctr,
          },
          channelB: {
            name: googleChannel.channelName,
            spend: googleChannel.spend,
            impressions: googleChannel.impressions,
            clicks: googleChannel.clicks,
            ctr: googleChannel.ctr,
          },
          currency,
        },
      });
    }
  }

  // 7. Milestones (meaningful moments from monthly data)
  const monthlyData = aggregatedData?.monthlyData || [];
  if (aggregatedData && monthlyData.length > 0) {
    const milestones: { icon: string; text: string }[] = [];
    
    // Find first major spike (month with highest results)
    const bestResultsMonth = monthlyData.reduce((best, m) => m.results > best.results ? m : best);
    if (bestResultsMonth.results > 0) {
      milestones.push({
        icon: "📈",
        text: `Your strongest performance was in ${bestResultsMonth.monthName} with ${bestResultsMonth.results.toLocaleString()} results`,
      });
    }
    
    // Find when they crossed impression milestones
    let cumulativeImpressions = 0;
    let crossed100k = false;
    let crossed1m = false;
    for (const m of monthlyData) {
      const monthImpressions = channelsData.reduce((sum, c) => {
        const channelMonth = (c.dailyData || []).filter((d: any) => d.date?.startsWith(m.month));
        return sum + channelMonth.reduce((s, d) => s + d.impressions, 0);
      }, 0);
      cumulativeImpressions += monthImpressions;
      
      if (!crossed100k && cumulativeImpressions >= 100000) {
        crossed100k = true;
        milestones.push({
          icon: "👁️",
          text: `You crossed 100K impressions in ${m.monthName}`,
        });
      }
      if (!crossed1m && cumulativeImpressions >= 1000000) {
        crossed1m = true;
        milestones.push({
          icon: "🎉",
          text: `You hit 1M impressions in ${m.monthName}`,
        });
      }
    }
    
    // Find lowest CPR month
    const bestCprMonth = aggregatedData.bestMonthByCpr;
    if (bestCprMonth && bestCprMonth.cpr > 0) {
      milestones.push({
        icon: "💰",
        text: `Your lowest CPR was in ${getMonthName(bestCprMonth.month)} at ${getCurrencySymbol(currency)}${bestCprMonth.cpr.toFixed(2)}`,
      });
    }
    
    // Find best ROAS month if revenue exists
    const bestRoasMonth = aggregatedData.bestMonthByRoas;
    if (bestRoasMonth && bestRoasMonth.roas > 0) {
      milestones.push({
        icon: "🚀",
        text: `Your best ROAS was ${bestRoasMonth.roas.toFixed(1)}x in ${getMonthName(bestRoasMonth.month)}`,
      });
    }
    
    if (milestones.length > 0) {
      slides.push({
        id: "milestones",
        type: "milestones",
        title: "Your Milestones",
        subtitle: "The meaningful moments from your year.",
        payload: {
          milestones,
          currency,
        },
      });
    }
  }

  // 8. Optimization Wins (best metrics achieved)
  const optimizationChannels = aggregatedData?.channels || channelsData || [];
  if (aggregatedData && optimizationChannels.length > 0) {
    // Calculate best metrics from all campaigns
    const allCampaigns = optimizationChannels.flatMap((c: any) => c.campaigns || []);
    const campaignsWithResults = allCampaigns.filter(c => c.results > 0 && c.cpr > 0);
    const campaignsWithClicks = allCampaigns.filter(c => c.clicks > 0 && c.cpc > 0);
    const campaignsWithImpressions = allCampaigns.filter(c => c.impressions > 0 && c.cpm > 0);
    const campaignsWithCtr = allCampaigns.filter(c => c.ctr > 0);
    
    const lowestCpr = campaignsWithResults.length > 0 
      ? Math.min(...campaignsWithResults.map(c => c.cpr)) 
      : parseNum(form.averageCpa);
    const highestCtr = campaignsWithCtr.length > 0 
      ? Math.max(...campaignsWithCtr.map(c => c.ctr)) 
      : parseNum(form.averageCtr);
    const lowestCpc = campaignsWithClicks.length > 0 
      ? Math.min(...campaignsWithClicks.map(c => c.cpc)) 
      : parseNum(form.averageCpc);
    const bestCpm = campaignsWithImpressions.length > 0 
      ? Math.min(...campaignsWithImpressions.map(c => c.cpm)) 
      : parseNum(form.averageCpm);
    
    // Find top results day from daily data
    let topResultsDay = "";
    let topResultsDayCount = 0;
    for (const channel of optimizationChannels) {
      for (const day of (channel.dailyData || [])) {
        if (day.results > topResultsDayCount) {
          topResultsDayCount = day.results;
          topResultsDay = day.date;
        }
      }
    }
    
    // Format the date nicely
    if (topResultsDay) {
      const date = new Date(topResultsDay);
      topResultsDay = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    }
    
    if (lowestCpr > 0 || highestCtr > 0 || lowestCpc > 0 || bestCpm > 0) {
      slides.push({
        id: "optimization-wins",
        type: "optimizationWins",
        title: "Your Optimization Wins",
        subtitle: "The best metrics you achieved this year.",
        payload: {
          lowestCpr,
          highestCtr,
          lowestCpc,
          bestCpm,
          topResultsDay: topResultsDay || undefined,
          topResultsDayCount: topResultsDayCount > 0 ? topResultsDayCount : undefined,
          currency,
        },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GOOGLE ADS SPECIFIC SLIDES (only shown when Google Ads data is available)
  // ─────────────────────────────────────────────────────────────────────────────

  const hasGoogleExtras = !!(
    aggregatedData?.googleAdsSearchTerms?.length ||
    aggregatedData?.googleAdsHourlyStats?.length ||
    aggregatedData?.googleAdsDeviceStats?.length ||
    aggregatedData?.googleAdsTopCampaigns?.length ||
    aggregatedData?.googleAdsMonthlyPerformance?.length
  );

  if (hasGoogleExtras) {
    slides.push({
      id: "section-google-ads",
      type: "platformSection",
      title: "Google Ads",
      subtitle: "Your deep-dive into Google performance.",
      payload: {
        platform: "google",
      },
    });
  }

  // Google Ads performance metrics (Google-only version of overall metrics)
  const googleSummary: any = (aggregatedData as any)?.googleAdsSummary;
  if (googleSummary && (googleSummary.impressions || googleSummary.clicks || googleSummary.conversions)) {
    const gImpressions = googleSummary.impressions || 0;
    const gClicks = googleSummary.clicks || 0;
    const gConversions = googleSummary.conversions || 0;
    const gSpend = googleSummary.spend || 0;
    const gCtr = googleSummary.ctr || (gImpressions > 0 ? (gClicks / gImpressions) * 100 : 0);
    const gCpc = googleSummary.cpc || (gClicks > 0 ? gSpend / gClicks : 0);
    const gCpa = gConversions > 0 ? gSpend / gConversions : 0;
    const gCpm = gImpressions > 0 ? (gSpend / gImpressions) * 1000 : 0;

    slides.push({
      id: "google-ads-metrics",
      type: "googleAdsMetrics",
      title: "Google Ads Performance Metrics",
      subtitle: "How Google Ads contributed to your results.",
      payload: {
        impressions: gImpressions,
        clicks: gClicks,
        conversions: gConversions,
        ctr: gCtr,
        cpc: gCpc,
        cpa: gCpa,
        cpm: gCpm,
        currency,
      },
    });
  }

  // 9. Search Term Word Cloud
  if (aggregatedData?.googleAdsSearchTerms && aggregatedData.googleAdsSearchTerms.length > 0) {
    slides.push({
      id: "search-term-cloud",
      type: "searchTermCloud",
      title: "Your Top Search Terms",
      subtitle: "The queries that drove your conversions.",
      payload: {
        terms: aggregatedData.googleAdsSearchTerms,
        currency,
      },
    });
  }

  // 10. Day/Hour Heatmap
  if (aggregatedData?.googleAdsHourlyStats && aggregatedData.googleAdsHourlyStats.length > 0) {
    slides.push({
      id: "day-hour-heatmap",
      type: "dayHourHeatmap",
      title: "When Your Ads Performed Best",
      subtitle: "Performance by day and hour.",
      payload: {
        data: aggregatedData.googleAdsHourlyStats,
        metric: "conversions",
        currency,
      },
    });
  }

  // 11. Device Breakdown
  if (aggregatedData?.googleAdsDeviceStats && aggregatedData.googleAdsDeviceStats.length > 0) {
    slides.push({
      id: "device-breakdown",
      type: "deviceBreakdown",
      title: "Device Performance",
      subtitle: "Where your audience engaged.",
      payload: {
        devices: aggregatedData.googleAdsDeviceStats,
        metric: "spend",
        currency,
      },
    });
  }

  // 12. Google Ads Top Campaigns
  if (aggregatedData?.googleAdsTopCampaigns && aggregatedData.googleAdsTopCampaigns.length > 0) {
    slides.push({
      id: "google-ads-campaigns",
      type: "googleAdsCampaigns",
      title: "Top Google Ads Campaigns",
      subtitle: "Your best performing campaigns by results.",
      payload: {
        campaigns: aggregatedData.googleAdsTopCampaigns,
        currency,
      },
    });
  }

  // 13. Google Ads Monthly Performance
  if (aggregatedData?.googleAdsMonthlyPerformance && aggregatedData.googleAdsMonthlyPerformance.length > 0) {
    slides.push({
      id: "google-ads-monthly",
      type: "googleAdsMonthly",
      title: "Your Peak Month",
      subtitle: "Monthly performance throughout the year.",
      payload: {
        months: aggregatedData.googleAdsMonthlyPerformance,
        metric: "roas",
        currency,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // META ADS SPECIFIC SLIDES (only shown when Meta Ads data is available)
  // ─────────────────────────────────────────────────────────────────────────────

  const hasMetaExtras = !!(
    (aggregatedData as any)?.metaAdsMonthlyPerformance?.length ||
    (aggregatedData as any)?.metaAdsBestDayOfWeek?.length ||
    (aggregatedData as any)?.metaAdsTopCampaignsByResults?.length ||
    (aggregatedData as any)?.metaAdsDeviceStats?.length
  );

  if (hasMetaExtras) {
    slides.push({
      id: "section-meta-ads",
      type: "platformSection",
      title: "Meta Ads",
      subtitle: "Your deep-dive into Meta performance.",
      payload: {
        platform: "meta",
      },
    });
  }

  // Meta Ads performance metrics (Meta-only version of overall metrics)
  const metaSummary: any = (aggregatedData as any)?.metaAdsSummary;
  if (metaSummary && (metaSummary.impressions || metaSummary.clicks || metaSummary.conversions)) {
    const mImpressions = metaSummary.impressions || 0;
    const mClicks = metaSummary.clicks || 0;
    const mResults = metaSummary.conversions || 0;
    const mSpend = metaSummary.spend || 0;
    const mCtr = metaSummary.ctr || (mImpressions > 0 ? (mClicks / mImpressions) * 100 : 0);
    const mCpc = metaSummary.cpc || (mClicks > 0 ? mSpend / mClicks : 0);
    const mCpr = mResults > 0 ? mSpend / mResults : 0;
    const mCpm = mImpressions > 0 ? (mSpend / mImpressions) * 1000 : 0;

    slides.push({
      id: "meta-ads-metrics",
      type: "metaAdsMetrics",
      title: "Meta Ads Performance Metrics",
      subtitle: "How Meta Ads contributed to your results.",
      payload: {
        impressions: mImpressions,
        clicks: mClicks,
        results: mResults,
        ctr: mCtr,
        cpc: mCpc,
        cpr: mCpr,
        cpm: mCpm,
        currency,
      },
    });
  }

  if ((aggregatedData as any)?.metaAdsMonthlyPerformance && (aggregatedData as any).metaAdsMonthlyPerformance.length > 0) {
    slides.push({
      id: "meta-ads-monthly",
      type: "metaAdsMonthly",
      title: "Your Peak Month on Meta",
      subtitle: "Monthly performance throughout the year.",
      payload: {
        months: (aggregatedData as any).metaAdsMonthlyPerformance,
        metric: "results",
        currency,
      },
    });
  }

  if ((aggregatedData as any)?.metaAdsBestDayOfWeek && (aggregatedData as any).metaAdsBestDayOfWeek.length > 0) {
    slides.push({
      id: "meta-ads-best-day",
      type: "metaAdsBestDay",
      title: "Best Days of the Week (Meta)",
      subtitle: "When landing page views hit hardest.",
      payload: {
        days: (aggregatedData as any).metaAdsBestDayOfWeek,
      },
    });
  }

  if ((aggregatedData as any)?.metaAdsTopCampaignsByResults && (aggregatedData as any).metaAdsTopCampaignsByResults.length > 0) {
    slides.push({
      id: "meta-ads-top-campaigns-results",
      type: "metaAdsCampaignsResults",
      title: "Top Meta Campaigns",
      subtitle: "Your best performing campaigns by results.",
      payload: {
        campaigns: (aggregatedData as any).metaAdsTopCampaignsByResults,
        currency,
      },
    });
  }

  if ((aggregatedData as any)?.metaAdsDeviceStats && (aggregatedData as any).metaAdsDeviceStats.length > 0) {
    slides.push({
      id: "meta-ads-device-breakdown",
      type: "metaAdsDeviceBreakdown",
      title: "Device Performance",
      subtitle: "Where your audience engaged.",
      payload: {
        devices: (aggregatedData as any).metaAdsDeviceStats,
        metric: "spend",
        currency,
      },
    });
  }

  // Recap
  slides.push({
    id: "recap",
    type: "recap",
    title: `That was your ${periodLabel} Ads Wrapped.`,
    subtitle: "Ready to make the next one even bigger?",
    payload: { handle: form.customerName || "you" },
  });

  return slides;
}

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL MEDIA WRAPPED SLIDES
// ─────────────────────────────────────────────────────────────────────────────

export function buildSocialSlidesFromForm(form: SocialFormData): Slide[] {
  const slides: Slide[] = [];

  const startFollowers = parseNum(form.startingFollowers);
  const endFollowers = parseNum(form.endingFollowers);
  const netGain = endFollowers - startFollowers;
  const growthPercent = startFollowers > 0 ? ((netGain / startFollowers) * 100) : 0;

  // Intro
  slides.push({
    id: "intro",
    type: "intro",
    title: `${form.customerName || "Your"}'s Social Media Wrapped`,
    subtitle: `Your year on ${form.primaryPlatform || "social media"}.`,
  });

  // 1. Follower Growth Chart (rich slide with bar chart)
  if (form.endingFollowers) {
    slides.push({
      id: "follower-growth",
      type: "followerGrowth",
      title: "Your Community Grew",
      subtitle: "Watch your audience expand throughout the year.",
      payload: {
        startFollowers,
        endFollowers,
        netGain,
        growthPercent,
        monthlyData: form.monthlyFollowers ? parseMonthlyData(form.monthlyFollowers) : undefined,
      },
    });
  }

  // 2. Impressions & Reach (dual stat slide)
  if (form.totalImpressions || form.totalReach) {
    const impressions = parseNum(form.totalImpressions);
    const reach = parseNum(form.totalReach);
    const posts = parseNum(form.totalPostsPublished);
    slides.push({
      id: "impressions-reach",
      type: "impressionsReach",
      title: "Your Content's Visibility",
      subtitle: "How far your posts traveled.",
      payload: {
        impressions,
        reach,
        postsPublished: posts,
        avgImpressionsPerPost: posts > 0 ? Math.round(impressions / posts) : 0,
      },
    });
  }

  // 3. Engagement Donut Chart
  if (form.totalLikes) {
    const likes = parseNum(form.totalLikes);
    const comments = parseNum(form.totalComments);
    const shares = parseNum(form.totalShares);
    const saves = parseNum(form.totalSaves);
    const total = likes + comments + shares + saves;

    const items = [];
    if (likes > 0) items.push({ name: "Likes", value: likes, color: "#ec4899" });
    if (comments > 0) items.push({ name: "Comments", value: comments, color: "#8b5cf6" });
    if (shares > 0) items.push({ name: "Shares", value: shares, color: "#3b82f6" });
    if (saves > 0) items.push({ name: "Saves", value: saves, color: "#10b981" });

    slides.push({
      id: "engagement-donut",
      type: "engagementDonut",
      title: "Engagement Breakdown",
      subtitle: "How your audience showed love.",
      payload: {
        items,
        totalEngagement: total,
        engagementRate: parseNum(form.avgEngagementRate),
      },
    });
  }

  // 4. Top Posts with clickable links
  if (form.topPost1Description) {
    const posts = [];
    if (form.topPost1Description) {
      posts.push({
        rank: 1,
        description: form.topPost1Description,
        likes: parseNum(form.topPost1Likes) || parseNum(form.topPost1Metrics),
        comments: parseNum(form.topPost1Comments) || 0,
        url: form.topPost1Url || undefined,
      });
    }
    if (form.topPost2Description) {
      posts.push({
        rank: 2,
        description: form.topPost2Description,
        likes: parseNum(form.topPost2Likes) || parseNum(form.topPost2Metrics),
        comments: parseNum(form.topPost2Comments) || 0,
        url: form.topPost2Url || undefined,
      });
    }
    if (form.topPost3Description) {
      posts.push({
        rank: 3,
        description: form.topPost3Description,
        likes: parseNum(form.topPost3Likes) || parseNum(form.topPost3Metrics),
        comments: parseNum(form.topPost3Comments) || 0,
        url: form.topPost3Url || undefined,
      });
    }

    slides.push({
      id: "top-posts",
      type: "topPosts",
      title: "Your Top Posts",
      subtitle: "The content that resonated most.",
      payload: {
        posts,
        platform: form.primaryPlatform || "Social",
      },
    });
  }

  // 5. Content Performance (best format, hashtag, viral reach)
  if (form.bestPerformingFormat) {
    slides.push({
      id: "content-performance",
      type: "contentPerformance",
      title: "Content That Worked",
      subtitle: "Your winning formula.",
      payload: {
        bestFormat: form.bestPerformingFormat,
        bestFormatReach: parseNum(form.mostViralPostReach),
        topHashtag: form.topHashtag,
        bestDay: form.bestEngagementDay,
        viralReach: parseNum(form.mostViralPostReach),
      },
    });
  }

  // 6. Best Posting Time (heatmap style)
  if (form.bestEngagementDay || form.peakActiveHours) {
    slides.push({
      id: "best-posting-time",
      type: "bestPostingTime",
      title: "When to Post",
      subtitle: "Your audience is most active at these times.",
      payload: {
        bestDay: form.bestEngagementDay,
        peakHours: form.peakActiveHours,
        platform: form.primaryPlatform || "Social",
      },
    });
  }

  // 7. Audience Demographics
  if (form.topCountry || form.topAgeRange) {
    slides.push({
      id: "audience-demographics",
      type: "audienceDemographics",
      title: "Your Audience",
      subtitle: "Who's following you.",
      payload: {
        topCountry: form.topCountry,
        topCity: form.topCity,
        topAgeRange: form.topAgeRange,
        genderSplit: form.genderSplit,
        peakHours: form.peakActiveHours,
        interests: form.audienceInterests,
      },
    });
  }

  // 8. Milestones (rich celebration slide)
  if (form.milestoneReached) {
    slides.push({
      id: "milestone",
      type: "socialMilestone",
      title: "Milestone Reached!",
      subtitle: "A moment worth celebrating.",
      payload: {
        milestone: form.milestoneReached,
        currentFollowers: endFollowers,
        bestMonth: form.bestGrowthMonth,
        platform: form.primaryPlatform || "Social",
      },
    });
  }

  // Recap
  slides.push({
    id: "recap",
    type: "recap",
    title: "That was your Social year.",
    subtitle: "Ready to go even more viral?",
    payload: { handle: form.customerName || form.primaryPlatform || "Creator" },
  });

  return slides;
}

// Helper to parse monthly follower data from string like "Jan:1000,Feb:1200,..."
function parseMonthlyData(str: string): { month: string; followers: number }[] {
  if (!str) return [];
  try {
    return str.split(",").map((pair) => {
      const [month, val] = pair.split(":");
      return { month: month?.trim() || "", followers: parseNum(val) };
    }).filter((d) => d.month && d.followers > 0);
  } catch {
    return [];
  }
}
