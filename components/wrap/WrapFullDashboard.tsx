"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Slide } from "../../lib/wrapSlides";
import { IntroSlide } from "./slides/IntroSlide";
import { BigNumberSlide } from "./slides/BigNumberSlide";
import { TopListSlide } from "./slides/TopListSlide";
import { BarTimelineSlide } from "./slides/BarTimelineSlide";
import { RecapSlide } from "./slides/RecapSlide";
import { HeatmapSlide } from "./slides/HeatmapSlide";
import { PeakHourSlide } from "./slides/PeakHourSlide";
import { GeoHotspotsSlide } from "./slides/GeoHotspotsSlide";
import { FunnelSlide } from "./slides/FunnelSlide";
import { CustomerLoyaltySlide } from "./slides/CustomerLoyaltySlide";
import { CartRecoverySlide } from "./slides/CartRecoverySlide";
import { SeasonalPeakSlide } from "./slides/SeasonalPeakSlide";
import { AovGrowthSlide } from "./slides/AovGrowthSlide";
import { TopCustomerSlide } from "./slides/TopCustomerSlide";
import { FastestSellingSlide } from "./slides/FastestSellingSlide";
import { ReviewsSlide } from "./slides/ReviewsSlide";
import { TotalRevenueSlide } from "./slides/TotalRevenueSlide";
import { OrdersCountSlide } from "./slides/OrdersCountSlide";
import { RefundRateSlide } from "./slides/RefundRateSlide";
import { DiscountUsageSlide } from "./slides/DiscountUsageSlide";
import { TopProductsSlide } from "./slides/TopProductsSlide";
import { ProductPerformanceSlide } from "./slides/ProductPerformanceSlide";
import { InventoryTurnoverSlide } from "./slides/InventoryTurnoverSlide";
import { CustomerLifetimeValueSlide } from "./slides/CustomerLifetimeValueSlide";
import { TopReferrersSlide } from "./slides/TopReferrersSlide";
import { FulfillmentSpeedSlide } from "./slides/FulfillmentSpeedSlide";
import { FollowerGrowthSlide } from "./slides/FollowerGrowthSlide";
import { EngagementDonutSlide } from "./slides/EngagementDonutSlide";
import { TopPostsSlide } from "./slides/TopPostsSlide";
import { AudienceDemographicsSlide } from "./slides/AudienceDemographicsSlide";
import { ImpressionsReachSlide } from "./slides/ImpressionsReachSlide";
import { ContentPerformanceSlide } from "./slides/ContentPerformanceSlide";
import { SocialMilestoneSlide } from "./slides/SocialMilestoneSlide";
import { BestPostingTimeSlide } from "./slides/BestPostingTimeSlide";
import { AdSpendRevenueSlide } from "./slides/AdSpendRevenueSlide";
import { AdSpendLeadsSlide } from "./slides/AdSpendLeadsSlide";
import { ChannelComparisonSlide } from "./slides/ChannelComparisonSlide";
import { CampaignPerformanceSlide } from "./slides/CampaignPerformanceSlide";
import { AdMetricsGridSlide } from "./slides/AdMetricsGridSlide";
import { CreativeWinsSlide } from "./slides/CreativeWinsSlide";
import { EfficiencyTrendsSlide } from "./slides/EfficiencyTrendsSlide";
import { ChannelShowdownSlide } from "./slides/ChannelShowdownSlide";
import { MilestonesSlide } from "./slides/MilestonesSlide";
import { OptimizationWinsSlide } from "./slides/OptimizationWinsSlide";
import { PlatformSectionSlide } from "./slides/PlatformSectionSlide";
import { SearchTermCloudSlide } from "./slides/SearchTermCloudSlide";
import { DayHourHeatmapSlide } from "./slides/DayHourHeatmapSlide";
import { DeviceBreakdownSlide } from "./slides/DeviceBreakdownSlide";
import { GoogleAdsCampaignsSlide } from "./slides/GoogleAdsCampaignsSlide";
import { GoogleAdsMonthlySlide } from "./slides/GoogleAdsMonthlySlide";
import { GoogleAdsMetricsSlide } from "./slides/GoogleAdsMetricsSlide";
import { MetaAdsMonthlySlide } from "./slides/MetaAdsMonthlySlide";
import { MetaAdsMetricsSlide } from "./slides/MetaAdsMetricsSlide";
import { MetaAdsBestDaySlide } from "./slides/MetaAdsBestDaySlide";
import { MetaAdsCampaignsResultsSlide } from "./slides/MetaAdsCampaignsResultsSlide";
import { MetaAdsDeviceBreakdownSlide } from "./slides/MetaAdsDeviceBreakdownSlide";

type Props = {
  slides: Slide[];
  onBack: () => void;
};

export function WrapFullDashboard({ slides, onBack }: Props) {
  const [expandedSlide, setExpandedSlide] = useState<Slide | null>(null);

  const items = slides.filter(
    (s) => s.type !== "wrapDashboard" && s.type !== "intro" && s.type !== "platformSection" && s.type !== "recap",
  );

  function renderSlide(slide: Slide) {
    switch (slide.type) {
      case "intro":
        return <IntroSlide slide={slide} />;
      case "bigNumber":
        return <BigNumberSlide slide={slide} />;
      case "topList":
        return <TopListSlide slide={slide} />;
      case "barTimeline":
        return <BarTimelineSlide slide={slide} />;
      case "heatmap":
        return <HeatmapSlide slide={slide} />;
      case "peakHour":
        return <PeakHourSlide slide={slide} />;
      case "geoHotspots":
        return <GeoHotspotsSlide slide={slide} />;
      case "funnel":
        return <FunnelSlide slide={slide} />;
      case "customerLoyalty":
        return <CustomerLoyaltySlide slide={slide} />;
      case "cartRecovery":
        return <CartRecoverySlide slide={slide} />;
      case "seasonalPeak":
        return <SeasonalPeakSlide slide={slide} />;
      case "aovGrowth":
        return <AovGrowthSlide slide={slide} />;
      case "topCustomer":
        return <TopCustomerSlide slide={slide} />;
      case "fastestSelling":
        return <FastestSellingSlide slide={slide} />;
      case "reviews":
        return <ReviewsSlide slide={slide} />;
      case "totalRevenue":
        return <TotalRevenueSlide slide={slide} />;
      case "ordersCount":
        return <OrdersCountSlide slide={slide} />;
      case "refundRate":
        return <RefundRateSlide slide={slide} />;
      case "discountUsage":
        return <DiscountUsageSlide slide={slide} />;
      case "topProducts":
        return <TopProductsSlide slide={slide} />;
      case "productPerformance":
        return <ProductPerformanceSlide slide={slide} />;
      case "inventoryTurnover":
        return <InventoryTurnoverSlide slide={slide} />;
      case "customerLifetimeValue":
        return <CustomerLifetimeValueSlide slide={slide} />;
      case "topReferrers":
        return <TopReferrersSlide slide={slide} />;
      case "fulfillmentSpeed":
        return <FulfillmentSpeedSlide slide={slide} />;
      case "followerGrowth":
        return <FollowerGrowthSlide slide={slide} />;
      case "engagementDonut":
        return <EngagementDonutSlide slide={slide} />;
      case "topPosts":
        return <TopPostsSlide slide={slide} />;
      case "audienceDemographics":
        return <AudienceDemographicsSlide slide={slide} />;
      case "impressionsReach":
        return <ImpressionsReachSlide slide={slide} />;
      case "contentPerformance":
        return <ContentPerformanceSlide slide={slide} />;
      case "socialMilestone":
        return <SocialMilestoneSlide slide={slide} />;
      case "bestPostingTime":
        return <BestPostingTimeSlide slide={slide} />;
      case "adSpendRevenue":
        return <AdSpendRevenueSlide slide={slide} />;
      case "adSpendLeads":
        return <AdSpendLeadsSlide slide={slide} />;
      case "channelComparison":
      case "channelLeads":
        return <ChannelComparisonSlide slide={slide} />;
      case "campaignPerformance":
      case "campaignLeads":
        return <CampaignPerformanceSlide slide={slide} />;
      case "adMetricsGrid":
        return <AdMetricsGridSlide slide={slide} />;
      case "creativeWins":
        return <CreativeWinsSlide slide={slide} />;
      case "efficiencyTrends":
        return <EfficiencyTrendsSlide slide={slide} />;
      case "channelShowdown":
        return <ChannelShowdownSlide slide={slide} />;
      case "milestones":
        return <MilestonesSlide slide={slide} />;
      case "optimizationWins":
        return <OptimizationWinsSlide slide={slide} />;
      case "platformSection":
        return <PlatformSectionSlide slide={slide} />;
      case "searchTermCloud":
        return <SearchTermCloudSlide slide={slide} />;
      case "dayHourHeatmap":
        return <DayHourHeatmapSlide slide={slide} />;
      case "deviceBreakdown":
        return <DeviceBreakdownSlide slide={slide} />;
      case "googleAdsMetrics":
        return <GoogleAdsMetricsSlide slide={slide} />;
      case "googleAdsCampaigns":
        return <GoogleAdsCampaignsSlide slide={slide} />;
      case "googleAdsMonthly":
        return <GoogleAdsMonthlySlide slide={slide} />;
      case "metaAdsMonthly":
        return <MetaAdsMonthlySlide slide={slide} />;
      case "metaAdsMetrics":
        return <MetaAdsMetricsSlide slide={slide} />;
      case "metaAdsBestDay":
        return <MetaAdsBestDaySlide slide={slide} />;
      case "metaAdsCampaignsResults":
        return <MetaAdsCampaignsResultsSlide slide={slide} />;
      case "metaAdsDeviceBreakdown":
        return <MetaAdsDeviceBreakdownSlide slide={slide} />;
      case "recap":
        return <RecapSlide slide={slide} />;
      default:
        return null;
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
      <motion.div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_100%_0%,rgba(129,140,248,0.35),transparent_55%),radial-gradient(circle_at_0%_100%,rgba(45,212,191,0.35),transparent_55%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 0.6 }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Dashboard</div>
            <h1 className="text-2xl font-semibold tracking-tight">Your wrap, all in one place</h1>
            <div className="mt-1 text-sm text-slate-300/80">Scroll to view all slides together.</div>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl border border-white/15 bg-black/20 hover:bg-white/10 transition text-sm"
          >
            Back to wrap
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {items.map((s, i) => (
            <div key={s.id} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/10">
                <div className="text-xs text-slate-300/80">Slide {i + 1}</div>
                <div className="text-[10px] text-slate-300/70 rounded-full border border-white/10 bg-black/20 px-2 py-1">
                  {s.type}
                </div>
              </div>
              <div className="aspect-[16/9] w-full">
                <div className="relative w-full h-full overflow-hidden">
                  <div className="pointer-events-none absolute left-0 top-0 h-[540px] w-[960px] origin-top-left scale-[0.62] lg:scale-[0.58]">
                    {renderSlide(s)}
                  </div>
                  <button
                    onClick={() => setExpandedSlide(s)}
                    className="absolute bottom-3 right-3 h-9 w-9 rounded-xl border border-white/15 bg-black/30 hover:bg-white/10 transition flex items-center justify-center"
                    aria-label="Expand slide"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9 3H5a2 2 0 0 0-2 2v4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M15 21h4a2 2 0 0 0 2-2v-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M21 9V5a2 2 0 0 0-2-2h-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M3 15v4a2 2 0 0 0 2 2h4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {expandedSlide ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setExpandedSlide(null)}
            aria-label="Close"
          />
          <div className="relative z-10 w-[960px] max-w-[95vw] aspect-[16/9] rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/40 via-slate-900/90 to-fuchsia-500/40 shadow-[0_40px_120px_rgba(0,0,0,0.75)] overflow-hidden">
            <div className="pointer-events-none w-full h-full">
              {renderSlide(expandedSlide)}
            </div>
            <button
              onClick={() => setExpandedSlide(null)}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-full border border-white/15 bg-black/30 hover:bg-white/10 transition text-xs"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
