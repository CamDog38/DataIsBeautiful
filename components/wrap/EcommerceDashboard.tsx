"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EcommFormData,
  initialEcommFormData,
  ECOMM_FORM_STORAGE_KEY,
  ADS_FORM_STORAGE_KEY,
  SOCIAL_FORM_STORAGE_KEY,
  parseNum,
} from "../../lib/formDataTypes";
import { NewAdsDashboard } from "./NewAdsDashboard";

type DashboardId = "ecommerce" | "social" | "ads";

const DASHBOARDS: { id: DashboardId; label: string; color: string }[] = [
  { id: "ecommerce", label: "E-commerce Wrapped", color: "emerald" },
  { id: "social", label: "Social Media Wrapped", color: "pink" },
  { id: "ads", label: "Ads Wrapped", color: "orange" },
];

interface DashboardProps {
  defaultTab?: DashboardId;
}

export default function EcommerceDashboard({ defaultTab = "ecommerce" }: DashboardProps) {
  const [activeDashboard, setActiveDashboard] = useState<DashboardId>(defaultTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
      {/* Top header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
          <span className="text-white/20">|</span>
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Data Is Beautiful
          </span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left-hand menu */}
        <aside className="w-64 border-r border-white/10 p-4 flex flex-col gap-2 shrink-0">
          <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-2 px-2">Dashboards</h2>
          {DASHBOARDS.map((d) => {
            const selected = activeDashboard === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveDashboard(d.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                  selected
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center p-6 md:p-10 overflow-auto">
          {activeDashboard === "ecommerce" && <EcommerceDashboardContent />}
          {activeDashboard === "social" && <SocialMediaDashboard />}
          {activeDashboard === "ads" && <NewAdsDashboard />}
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   E-COMMERCE DASHBOARD - Uses imported EcommFormData from formDataTypes.ts
───────────────────────────────────────────────────────────────────────────── */

const ECOMM_STEPS = [
  "Basics",
  "Revenue & Orders", 
  "Products",
  "Customers",
  "Traffic & Marketing",
  "Fulfillment",
  "Peak Performance",
  "Reviews"
] as const;

function EcommerceDashboardContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EcommFormData>(initialEcommFormData);
  const [importMode, setImportMode] = useState<"manual" | "automatic">("manual");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(ECOMM_FORM_STORAGE_KEY);
    if (stored) {
      try {
        setFormData(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(ECOMM_FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  // Auto-calc key growth percentages for E-commerce when base values change
  useEffect(() => {
    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };

      // Revenue growth % = (this year - last year) / last year * 100
      const rev = parseNum(prev.totalRevenue);
      const revPrev = parseNum(prev.previousYearRevenue);
      if (rev > 0 && revPrev > 0) {
        const g = ((rev - revPrev) / revPrev) * 100;
        const formatted = g.toFixed(1);
        if (prev.revenueGrowthPercent !== formatted) {
          next.revenueGrowthPercent = formatted;
          changed = true;
        }
      }

      // Orders growth %
      const orders = parseNum(prev.totalOrders);
      const ordersPrev = parseNum(prev.previousYearOrders);
      if (orders > 0 && ordersPrev > 0) {
        const g = ((orders - ordersPrev) / ordersPrev) * 100;
        const formatted = g.toFixed(1);
        if (prev.ordersGrowthPercent !== formatted) {
          next.ordersGrowthPercent = formatted;
          changed = true;
        }
      }

      // AOV growth %
      const aovStart = parseNum(prev.startAov);
      const aovEnd = parseNum(prev.endAov);
      if (aovStart > 0 && aovEnd > 0) {
        const g = ((aovEnd - aovStart) / aovStart) * 100;
        const formatted = g.toFixed(1);
        if (prev.aovGrowthPercent !== formatted) {
          next.aovGrowthPercent = formatted;
          changed = true;
        }
      }

      // CLV growth %
      const clv = parseNum(prev.averageCLV);
      const clvPrev = parseNum(prev.previousYearCLV);
      if (clv > 0 && clvPrev > 0) {
        const g = ((clv - clvPrev) / clvPrev) * 100;
        const formatted = g.toFixed(1);
        if (prev.clvGrowthPercent !== formatted) {
          next.clvGrowthPercent = formatted;
          changed = true;
        }
      }

      // Fulfillment improvement % = (prev - current) / prev * 100
      const fulfil = parseNum(prev.averageFulfillmentHours);
      const fulfilPrev = parseNum(prev.previousYearFulfillmentHours);
      if (fulfil > 0 && fulfilPrev > 0) {
        const g = ((fulfilPrev - fulfil) / fulfilPrev) * 100;
        const formatted = g.toFixed(1);
        if (prev.fulfillmentImprovementPercent !== formatted) {
          next.fulfillmentImprovementPercent = formatted;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [formData.totalRevenue, formData.previousYearRevenue, formData.totalOrders, formData.previousYearOrders, formData.startAov, formData.endAov, formData.averageCLV, formData.previousYearCLV, formData.averageFulfillmentHours, formData.previousYearFulfillmentHours]);

  const updateField = useCallback((field: keyof EcommFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0: return !!(formData.userName && formData.year && formData.currencyCode);
      case 1: return !!(formData.totalRevenue && formData.totalOrders);
      case 2: return !!(formData.topProduct1Name);
      case 3: return !!(formData.averageCLV);
      case 4: return !!(formData.referrer1Source);
      case 5: return !!(formData.averageFulfillmentHours);
      case 6: return !!(formData.peakDay);
      case 7: return !!(formData.totalReviews);
      default: return false;
    }
  };

  const allStepsComplete = ECOMM_STEPS.every((_, i) => isStepComplete(i));
  const isLastStep = currentStep === ECOMM_STEPS.length - 1;
  const canGoBack = currentStep > 0;

  const handleGenerate = async () => {
    // Build slides from form data
    const { buildEcommSlidesFromForm } = await import("../../lib/buildSlidesFromForm");
    const slides = buildEcommSlidesFromForm(formData);
    
    try {
      // Save to database
      const res = await fetch("/api/wraps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${formData.userName || "My"}'s E-commerce Wrapped`,
          wrap_type: "ecommerce",
          year: formData.year ? parseInt(formData.year) : new Date().getFullYear(),
          form_data: formData,
          slides_data: slides,
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.shareUrl) {
        // Redirect to the unique wrap URL
        router.push(data.shareUrl);
      } else {
        // Fallback to preview mode
        router.push("/wrap-ecommerce");
      }
    } catch (error) {
      // Fallback to preview mode if save fails
      console.error("Failed to save wrap:", error);
      router.push("/wrap-ecommerce");
    }
  };

  return (
    <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-[0_40px_120px_rgba(0,0,0,0.9)] overflow-hidden">
      <div className="border-b border-white/10 px-6 md:px-8 py-5 md:py-6 flex items-center justify-between gap-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">E-commerce Wrapped Dashboard</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
            Fill in your data to generate a personalized E-commerce Wrapped presentation.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <a
            href="/ecomm-wrapped-template.csv"
            download
            className="inline-flex items-center rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 md:px-4 py-1.5 text-[11px] md:text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition"
          >
            Data you will need
          </a>
        </div>
      </div>

      {/* Import Mode Toggle */}
      <div className="px-6 md:px-8 py-3 border-b border-white/10 flex gap-3">
        <button
          onClick={() => setImportMode("manual")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            importMode === "manual"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
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
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Automatic Import
        </button>
      </div>

      {/* Step indicators - Only show for Manual Import */}
      {importMode === "manual" && (
      <div className="px-6 md:px-8 pt-4 pb-5 md:pb-6 border-b border-white/5 flex gap-2 overflow-x-auto">
        {ECOMM_STEPS.map((step, index) => {
          const isActive = currentStep === index;
          const isComplete = isStepComplete(index);
          return (
            <button
              key={step}
              type="button"
              onClick={() => setCurrentStep(index)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition border flex items-center gap-1.5 ${
                isActive
                  ? "bg-white text-slate-900 border-white"
                  : isComplete
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                  : "bg-slate-900/80 text-slate-300 border-white/10 hover:border-white/40"
              }`}
            >
              {isComplete && !isActive && <span className="text-green-400">✓</span>}
              <span>{index + 1}. {step}</span>
            </button>
          );
        })}
      </div>
      )}

      {/* Content - Manual Import */}
      {importMode === "manual" && (
      <div className="px-6 md:px-8 py-5 md:py-6 max-h-[60vh] overflow-y-auto">
        <section className="space-y-4">
          {currentStep === 0 && <EcommBasicsForm formData={formData} updateField={updateField} />}
          {currentStep === 1 && <EcommRevenueForm formData={formData} updateField={updateField} />}
          {currentStep === 2 && <EcommProductsForm formData={formData} updateField={updateField} />}
          {currentStep === 3 && <EcommCustomersForm formData={formData} updateField={updateField} />}
          {currentStep === 4 && <EcommTrafficForm formData={formData} updateField={updateField} />}
          {currentStep === 5 && <EcommFulfillmentForm formData={formData} updateField={updateField} />}
          {currentStep === 6 && <EcommPeakForm formData={formData} updateField={updateField} />}
          {currentStep === 7 && <EcommReviewsForm formData={formData} updateField={updateField} />}
        </section>
      </div>
      )}

      {/* Automatic Import Placeholder */}
      {importMode === "automatic" && (
        <div className="p-6 md:p-8">
          <div className="rounded-2xl border-2 border-dashed border-emerald-400/30 bg-emerald-500/5 p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">API Integration Coming Soon</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
              Connect your e-commerce platforms directly to automatically import your store data. 
              Supported platforms will include Shopify, WooCommerce, BigCommerce, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-xs text-slate-400">
                Shopify
              </div>
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-xs text-slate-400">
                WooCommerce
              </div>
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-xs text-slate-400">
                BigCommerce
              </div>
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-xs text-slate-400">
                Magento
              </div>
            </div>
            <button
              onClick={() => setImportMode("manual")}
              className="mt-6 px-5 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition"
            >
              Use Manual Import Instead
            </button>
          </div>
        </div>
      )}

      {/* Navigation buttons - Only show for Manual Import */}
      {importMode === "manual" && (
      <div className="px-6 md:px-8 py-4 border-t border-white/5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={!canGoBack}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${
            canGoBack
              ? "bg-slate-800 text-white hover:bg-slate-700"
              : "bg-slate-900 text-slate-600 cursor-not-allowed"
          }`}
        >
          ← Back
        </button>

        <div className="text-xs text-slate-400">
          Step {currentStep + 1} of {ECOMM_STEPS.length}
        </div>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!allStepsComplete}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition shadow-lg ${
              allStepsComplete
                ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            Generate E-commerce Wrapped →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s + 1)}
            className="rounded-full px-5 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-400 transition"
          >
            Next →
          </button>
        )}
      </div>
      )}
    </div>
  );
}

interface EcommFormProps {
  formData: EcommFormData;
  updateField: (field: keyof EcommFormData, value: string) => void;
}

function EcommBasicsForm({ formData, updateField }: EcommFormProps) {
  return (
    <div className="space-y-4">
      <Section title="Basic Info" description="Your name and the year for this Wrapped." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Your name / Store name *" placeholder="Acme Store" value={formData.userName} onChange={(v) => updateField("userName", v)} />
        <FieldRow label="Year *" placeholder="2024" value={formData.year} onChange={(v) => updateField("year", v)} />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300">Currency</label>
          <select
            className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
            value={formData.currencyCode}
            onChange={(e) => updateField("currencyCode", e.target.value)}
          >
            <option value="USD">$ USD</option>
            <option value="GBP">£ GBP</option>
            <option value="EUR">€ EUR</option>
            <option value="AED">د.إ AED</option>
            <option value="ZAR">R ZAR</option>
            <option value="AUD">$ AUD</option>
            <option value="CAD">$ CAD</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function EcommRevenueForm({ formData, updateField }: EcommFormProps) {
  return (
    <div className="space-y-4">
      <Section title="Revenue & Orders" description="Your total revenue and order metrics." />
      <div className="space-y-3">
        <FormGroup title="Revenue">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="Total revenue *" placeholder="$4,127,000" help="Total sales for the year" value={formData.totalRevenue} onChange={(v) => updateField("totalRevenue", v)} />
            <FieldRow label="Previous year revenue" placeholder="$3,245,000" value={formData.previousYearRevenue} onChange={(v) => updateField("previousYearRevenue", v)} />
            <FieldRow label="Revenue growth %" placeholder="27.2" value={formData.revenueGrowthPercent} onChange={(v) => updateField("revenueGrowthPercent", v)} />
          </div>
        </FormGroup>

        <FormGroup title="Orders">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="Total orders *" placeholder="48,420" value={formData.totalOrders} onChange={(v) => updateField("totalOrders", v)} />
            <FieldRow label="Previous year orders" placeholder="38,100" value={formData.previousYearOrders} onChange={(v) => updateField("previousYearOrders", v)} />
            <FieldRow label="Orders growth %" placeholder="27.1" value={formData.ordersGrowthPercent} onChange={(v) => updateField("ordersGrowthPercent", v)} />
            <FieldRow label="Average orders per day" placeholder="133" value={formData.averageOrdersPerDay} onChange={(v) => updateField("averageOrdersPerDay", v)} />
          </div>
        </FormGroup>

        <FormGroup title="Average order value">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="Start AOV" placeholder="$67" help="Average order value at start of year" value={formData.startAov} onChange={(v) => updateField("startAov", v)} />
            <FieldRow label="End AOV" placeholder="$84" help="Average order value at end of year" value={formData.endAov} onChange={(v) => updateField("endAov", v)} />
            <FieldRow label="AOV growth %" placeholder="25" value={formData.aovGrowthPercent} onChange={(v) => updateField("aovGrowthPercent", v)} />
          </div>
        </FormGroup>
      </div>

      <Section title="Refunds" description="Refund metrics and top reasons." />
      <FormGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Total refunds" placeholder="1,842" value={formData.totalRefunds} onChange={(v) => updateField("totalRefunds", v)} />
          <FieldRow label="Refund rate %" placeholder="3.8" value={formData.refundRate} onChange={(v) => updateField("refundRate", v)} />
          <FieldRow label="Refund amount" placeholder="$156,000" value={formData.refundAmount} onChange={(v) => updateField("refundAmount", v)} />
          <FieldRow label="Industry avg refund rate" placeholder="8.5" value={formData.industryAverageRefundRate} onChange={(v) => updateField("industryAverageRefundRate", v)} />
          <FieldRow label="Top refund reason #1" placeholder="Wrong size" value={formData.refundReason1} onChange={(v) => updateField("refundReason1", v)} />
          <FieldRow label="Reason #1 %" placeholder="42" value={formData.refundReason1Percent} onChange={(v) => updateField("refundReason1Percent", v)} />
          <FieldRow label="Top refund reason #2" placeholder="Changed mind" value={formData.refundReason2} onChange={(v) => updateField("refundReason2", v)} />
          <FieldRow label="Reason #2 %" placeholder="28" value={formData.refundReason2Percent} onChange={(v) => updateField("refundReason2Percent", v)} />
        </div>
      </FormGroup>
    </div>
  );
}

function EcommProductsForm({ formData, updateField }: EcommFormProps) {
  return (
    <div className="space-y-4">
      <Section title="Top Products" description="Your best-selling products." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FieldRow label="Product #1 name *" placeholder="Widget Pro Max" value={formData.topProduct1Name} onChange={(v) => updateField("topProduct1Name", v)} />
        <FieldRow label="Product #1 revenue" placeholder="$428,000" value={formData.topProduct1Revenue} onChange={(v) => updateField("topProduct1Revenue", v)} />
        <FieldRow label="Product #1 units" placeholder="2,840" value={formData.topProduct1Units} onChange={(v) => updateField("topProduct1Units", v)} />
        <FieldRow label="Product #2 name" placeholder="Classic Tee Bundle" value={formData.topProduct2Name} onChange={(v) => updateField("topProduct2Name", v)} />
        <FieldRow label="Product #2 revenue" placeholder="$312,000" value={formData.topProduct2Revenue} onChange={(v) => updateField("topProduct2Revenue", v)} />
        <FieldRow label="Product #2 units" placeholder="5,200" value={formData.topProduct2Units} onChange={(v) => updateField("topProduct2Units", v)} />
        <FieldRow label="Product #3 name" placeholder="Premium Headphones" value={formData.topProduct3Name} onChange={(v) => updateField("topProduct3Name", v)} />
        <FieldRow label="Product #3 revenue" placeholder="$289,000" value={formData.topProduct3Revenue} onChange={(v) => updateField("topProduct3Revenue", v)} />
        <FieldRow label="Product #3 units" placeholder="1,820" value={formData.topProduct3Units} onChange={(v) => updateField("topProduct3Units", v)} />
      </div>
      <Section title="Fastest Selling" description="Your fastest sellout product." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Product name" placeholder="Widget Pro Max" value={formData.fastestSellingProduct} onChange={(v) => updateField("fastestSellingProduct", v)} />
        <FieldRow label="Sold out time" placeholder="4 hours" value={formData.fastestSellingSoldOutTime} onChange={(v) => updateField("fastestSellingSoldOutTime", v)} />
        <FieldRow label="Units sold" placeholder="2,400" value={formData.fastestSellingUnitsSold} onChange={(v) => updateField("fastestSellingUnitsSold", v)} />
        <FieldRow label="Launch date" placeholder="Sep 15" value={formData.fastestSellingLaunchDate} onChange={(v) => updateField("fastestSellingLaunchDate", v)} />
      </div>
      <Section title="Inventory" description="Inventory turnover metrics." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Average turnover" placeholder="8.4" value={formData.averageTurnover} onChange={(v) => updateField("averageTurnover", v)} />
        <FieldRow label="Industry avg turnover" placeholder="6.2" value={formData.industryAverageTurnover} onChange={(v) => updateField("industryAverageTurnover", v)} />
        <FieldRow label="Total SKUs" placeholder="342" value={formData.totalSkus} onChange={(v) => updateField("totalSkus", v)} />
        <FieldRow label="Fast movers" placeholder="89" value={formData.fastMovers} onChange={(v) => updateField("fastMovers", v)} />
        <FieldRow label="Slow movers" placeholder="42" value={formData.slowMovers} onChange={(v) => updateField("slowMovers", v)} />
        <FieldRow label="Out of stock events" placeholder="23" value={formData.outOfStockEvents} onChange={(v) => updateField("outOfStockEvents", v)} />
      </div>
    </div>
  );
}

function EcommCustomersForm({ formData, updateField }: EcommFormProps) {
  return (
    <div className="space-y-4">
      <Section title="Customer Lifetime Value" description="CLV metrics and segments." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Average CLV *" placeholder="$284" value={formData.averageCLV} onChange={(v) => updateField("averageCLV", v)} />
        <FieldRow label="Previous year CLV" placeholder="$218" value={formData.previousYearCLV} onChange={(v) => updateField("previousYearCLV", v)} />
        <FieldRow label="CLV growth %" placeholder="30.3" value={formData.clvGrowthPercent} onChange={(v) => updateField("clvGrowthPercent", v)} />
        <FieldRow label="VIP customers" placeholder="842" value={formData.vipCustomers} onChange={(v) => updateField("vipCustomers", v)} />
        <FieldRow label="VIP CLV" placeholder="$1,240" value={formData.vipCLV} onChange={(v) => updateField("vipCLV", v)} />
        <FieldRow label="Loyal customers" placeholder="4,210" value={formData.loyalCustomers} onChange={(v) => updateField("loyalCustomers", v)} />
        <FieldRow label="Loyal CLV" placeholder="$520" value={formData.loyalCLV} onChange={(v) => updateField("loyalCLV", v)} />
      </div>
      <Section title="Customer Loyalty" description="New vs returning customers." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="New customers" placeholder="28,400" value={formData.newCustomers} onChange={(v) => updateField("newCustomers", v)} />
        <FieldRow label="Returning customers" placeholder="14,800" value={formData.returningCustomers} onChange={(v) => updateField("returningCustomers", v)} />
        <FieldRow label="New customer revenue" placeholder="$1,840,000" value={formData.newRevenue} onChange={(v) => updateField("newRevenue", v)} />
        <FieldRow label="Returning customer revenue" placeholder="$2,160,000" value={formData.returningRevenue} onChange={(v) => updateField("returningRevenue", v)} />
      </div>
      <Section title="Top Customer" description="Your #1 customer (anonymized)." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Order count" placeholder="47" value={formData.topCustomerOrderCount} onChange={(v) => updateField("topCustomerOrderCount", v)} />
        <FieldRow label="Total spent" placeholder="$8,420" value={formData.topCustomerTotalSpent} onChange={(v) => updateField("topCustomerTotalSpent", v)} />
        <FieldRow label="Member since" placeholder="2021" value={formData.topCustomerMemberSince} onChange={(v) => updateField("topCustomerMemberSince", v)} />
        <FieldRow label="Favorite category" placeholder="Electronics" value={formData.topCustomerFavoriteCategory} onChange={(v) => updateField("topCustomerFavoriteCategory", v)} />
      </div>
    </div>
  );
}

function EcommTrafficForm({ formData, updateField }: EcommFormProps) {
  return (
    <div className="space-y-4">
      <Section title="Top Traffic Sources" description="Where your customers came from." />
      <FormGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Source #1 *" placeholder="Google Organic" value={formData.referrer1Source} onChange={(v) => updateField("referrer1Source", v)} />
          <FieldRow label="Source #1 visitors" placeholder="842,000" value={formData.referrer1Visitors} onChange={(v) => updateField("referrer1Visitors", v)} />
          <FieldRow label="Source #1 revenue" placeholder="$1,240,000" value={formData.referrer1Revenue} onChange={(v) => updateField("referrer1Revenue", v)} />
          <FieldRow label="Source #1 conversion %" placeholder="2.1" value={formData.referrer1ConversionRate} onChange={(v) => updateField("referrer1ConversionRate", v)} />
          <FieldRow label="Source #2" placeholder="Instagram" value={formData.referrer2Source} onChange={(v) => updateField("referrer2Source", v)} />
          <FieldRow label="Source #2 visitors" placeholder="524,000" value={formData.referrer2Visitors} onChange={(v) => updateField("referrer2Visitors", v)} />
          <FieldRow label="Source #2 revenue" placeholder="$892,000" value={formData.referrer2Revenue} onChange={(v) => updateField("referrer2Revenue", v)} />
          <FieldRow label="Source #2 conversion %" placeholder="2.8" value={formData.referrer2ConversionRate} onChange={(v) => updateField("referrer2ConversionRate", v)} />
          <FieldRow label="Source #3" placeholder="Facebook Ads" value={formData.referrer3Source} onChange={(v) => updateField("referrer3Source", v)} />
          <FieldRow label="Source #3 visitors" placeholder="312,000" value={formData.referrer3Visitors} onChange={(v) => updateField("referrer3Visitors", v)} />
          <FieldRow label="Source #3 revenue" placeholder="$624,000" value={formData.referrer3Revenue} onChange={(v) => updateField("referrer3Revenue", v)} />
          <FieldRow label="Source #3 conversion %" placeholder="3.2" value={formData.referrer3ConversionRate} onChange={(v) => updateField("referrer3ConversionRate", v)} />
        </div>
      </FormGroup>
      <Section title="Discount Codes" description="Your top-performing discount codes." />
      <FormGroup>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FieldRow label="Code #1" placeholder="SUMMER20" value={formData.discountCode1} onChange={(v) => updateField("discountCode1", v)} />
          <FieldRow label="Code #1 uses" placeholder="4,820" value={formData.discountCode1Uses} onChange={(v) => updateField("discountCode1Uses", v)} />
          <FieldRow label="Code #1 revenue" placeholder="$482,000" value={formData.discountCode1Revenue} onChange={(v) => updateField("discountCode1Revenue", v)} />
          <FieldRow label="Code #2" placeholder="WELCOME10" value={formData.discountCode2} onChange={(v) => updateField("discountCode2", v)} />
          <FieldRow label="Code #2 uses" placeholder="3,940" value={formData.discountCode2Uses} onChange={(v) => updateField("discountCode2Uses", v)} />
          <FieldRow label="Code #2 revenue" placeholder="$198,000" value={formData.discountCode2Revenue} onChange={(v) => updateField("discountCode2Revenue", v)} />
        </div>
      </FormGroup>
      <Section title="Funnel" description="Customer journey from visit to purchase." />
      <FormGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Visitors" placeholder="2,400,000" value={formData.funnelVisitors} onChange={(v) => updateField("funnelVisitors", v)} />
          <FieldRow label="Product views" placeholder="1,680,000" value={formData.funnelProductViews} onChange={(v) => updateField("funnelProductViews", v)} />
          <FieldRow label="Added to cart" placeholder="182,000" value={formData.funnelAddedToCart} onChange={(v) => updateField("funnelAddedToCart", v)} />
          <FieldRow label="Checkout" placeholder="98,000" value={formData.funnelCheckout} onChange={(v) => updateField("funnelCheckout", v)} />
          <FieldRow label="Purchased" placeholder="42,000" value={formData.funnelPurchased} onChange={(v) => updateField("funnelPurchased", v)} />
        </div>
      </FormGroup>
      <Section title="Cart Recovery" description="Abandoned cart recovery metrics." />
      <FormGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Abandoned carts" placeholder="140,000" value={formData.abandonedCarts} onChange={(v) => updateField("abandonedCarts", v)} />
          <FieldRow label="Recovered carts" placeholder="12,600" value={formData.recoveredCarts} onChange={(v) => updateField("recoveredCarts", v)} />
          <FieldRow label="Recovered revenue" placeholder="$89,400" value={formData.recoveredRevenue} onChange={(v) => updateField("recoveredRevenue", v)} />
          <FieldRow label="Recovery rate %" placeholder="9" value={formData.recoveryRate} onChange={(v) => updateField("recoveryRate", v)} />
        </div>
      </FormGroup>
    </div>
  );
}

function EcommFulfillmentForm({ formData, updateField }: EcommFormProps) {
  return (
    <div className="space-y-4">
      <Section title="Fulfillment Speed" description="How fast you ship orders." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Average hours to ship *" placeholder="18" value={formData.averageFulfillmentHours} onChange={(v) => updateField("averageFulfillmentHours", v)} />
        <FieldRow label="Previous year hours" placeholder="28" value={formData.previousYearFulfillmentHours} onChange={(v) => updateField("previousYearFulfillmentHours", v)} />
        <FieldRow label="Improvement %" placeholder="36" value={formData.fulfillmentImprovementPercent} onChange={(v) => updateField("fulfillmentImprovementPercent", v)} />
        <FieldRow label="Same day %" placeholder="12" value={formData.sameDayPercent} onChange={(v) => updateField("sameDayPercent", v)} />
        <FieldRow label="Next day %" placeholder="64" value={formData.nextDayPercent} onChange={(v) => updateField("nextDayPercent", v)} />
        <FieldRow label="2+ day %" placeholder="24" value={formData.twoPlusDayPercent} onChange={(v) => updateField("twoPlusDayPercent", v)} />
        <FieldRow label="On-time rate %" placeholder="96.4" value={formData.onTimeRate} onChange={(v) => updateField("onTimeRate", v)} />
      </div>
      <Section title="Geographic Markets" description="Your top regions by sales." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Top region" placeholder="California" value={formData.topRegion} onChange={(v) => updateField("topRegion", v)} />
        <FieldRow label="Top region sales" placeholder="$1,247,000" value={formData.topRegionSales} onChange={(v) => updateField("topRegionSales", v)} />
        <FieldRow label="Region #2" placeholder="Texas" value={formData.region2Name} onChange={(v) => updateField("region2Name", v)} />
        <FieldRow label="Region #2 sales" placeholder="$892,000" value={formData.region2Sales} onChange={(v) => updateField("region2Sales", v)} />
        <FieldRow label="Region #3" placeholder="New York" value={formData.region3Name} onChange={(v) => updateField("region3Name", v)} />
        <FieldRow label="Region #3 sales" placeholder="$756,000" value={formData.region3Sales} onChange={(v) => updateField("region3Sales", v)} />
      </div>
    </div>
  );
}

function EcommPeakForm({ formData, updateField }: EcommFormProps) {
  return (
    <div className="space-y-4">
      <Section title="Peak Day" description="Your biggest sales day." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Peak day name *" placeholder="Black Friday" value={formData.peakDay} onChange={(v) => updateField("peakDay", v)} />
        <FieldRow label="Peak date" placeholder="Nov 24" value={formData.peakDate} onChange={(v) => updateField("peakDate", v)} />
        <FieldRow label="Peak day revenue" placeholder="$156,000" value={formData.peakDayRevenue} onChange={(v) => updateField("peakDayRevenue", v)} />
        <FieldRow label="Average day revenue" placeholder="$11,200" value={formData.averageDayRevenue} onChange={(v) => updateField("averageDayRevenue", v)} />
      </div>
      <Section title="Peak Hour" description="When customers shop most." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Peak hour (0-23)" placeholder="14" value={formData.peakHour} onChange={(v) => updateField("peakHour", v)} />
        <FieldRow label="Peak hour label" placeholder="2 PM" value={formData.peakHourLabel} onChange={(v) => updateField("peakHourLabel", v)} />
        <FieldRow label="Sales at peak" placeholder="$48,500" value={formData.salesAtPeak} onChange={(v) => updateField("salesAtPeak", v)} />
      </div>
    </div>
  );
}

function EcommReviewsForm({ formData, updateField }: EcommFormProps) {
  return (
    <div className="space-y-4">
      <Section title="Customer Reviews" description="What customers said about you." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Total reviews *" placeholder="4,847" value={formData.totalReviews} onChange={(v) => updateField("totalReviews", v)} />
        <FieldRow label="5-star reviews" placeholder="3,892" value={formData.fiveStarCount} onChange={(v) => updateField("fiveStarCount", v)} />
        <FieldRow label="Average rating" placeholder="4.7" value={formData.averageRating} onChange={(v) => updateField("averageRating", v)} />
        <FieldRow label="Top word #1" placeholder="quality" value={formData.topReviewWord1} onChange={(v) => updateField("topReviewWord1", v)} />
        <FieldRow label="Top word #2" placeholder="fast" value={formData.topReviewWord2} onChange={(v) => updateField("topReviewWord2", v)} />
        <FieldRow label="Top word #3" placeholder="love" value={formData.topReviewWord3} onChange={(v) => updateField("topReviewWord3", v)} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SOCIAL MEDIA DASHBOARD
───────────────────────────────────────────────────────────────────────────── */

const SOCIAL_STEPS = ["Overview", "Engagement", "Content", "Audience", "Growth"] as const;

interface SocialFormData {
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
  topPost1Url: string;
  topPost1Likes: string;
  topPost1Comments: string;
  topPost2Description: string;
  topPost2Metrics: string;
  topPost2Url: string;
  topPost2Likes: string;
  topPost2Comments: string;
  topPost3Description: string;
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
  monthlyFollowers: string;
}

const initialSocialFormData: SocialFormData = {
  customerName: "",
  currencyCode: "USD",
  startingFollowers: "",
  endingFollowers: "",
  totalImpressions: "",
  totalReach: "",
  totalPostsPublished: "",
  primaryPlatform: "",
  totalLikes: "",
  totalComments: "",
  totalShares: "",
  totalSaves: "",
  avgEngagementRate: "",
  bestEngagementDay: "",
  topPost1Description: "",
  topPost1Metrics: "",
  topPost1Url: "",
  topPost1Likes: "",
  topPost1Comments: "",
  topPost2Description: "",
  topPost2Metrics: "",
  topPost2Url: "",
  topPost2Likes: "",
  topPost2Comments: "",
  topPost3Description: "",
  topPost3Metrics: "",
  topPost3Url: "",
  topPost3Likes: "",
  topPost3Comments: "",
  bestPerformingFormat: "",
  mostViralPostReach: "",
  topHashtag: "",
  bestCampaign: "",
  topAgeRange: "",
  genderSplit: "",
  topCountry: "",
  topCity: "",
  peakActiveHours: "",
  audienceInterests: "",
  netNewFollowers: "",
  growthRate: "",
  bestGrowthMonth: "",
  milestoneReached: "",
  notableCollaborations: "",
  newPlatformLaunched: "",
  monthlyFollowers: "",
};

function SocialMediaDashboard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<SocialFormData>(initialSocialFormData);
  const [importMode, setImportMode] = useState<"manual" | "automatic">("manual");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SOCIAL_FORM_STORAGE_KEY);
    if (stored) {
      try {
        setFormData(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(SOCIAL_FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  // Auto-calc follower growth % for Social Media when follower counts change
  useEffect(() => {
    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };

      const start = parseNum(prev.startingFollowers);
      const end = parseNum(prev.endingFollowers);
      if (start > 0 && end >= start) {
        const net = end - start;
        const g = (net / start) * 100;
        const netFormatted = net.toLocaleString();
        const gFormatted = g.toFixed(1);

        if (prev.netNewFollowers !== netFormatted) {
          next.netNewFollowers = netFormatted;
          changed = true;
        }
        if (prev.growthRate !== gFormatted) {
          next.growthRate = gFormatted;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [formData.startingFollowers, formData.endingFollowers]);

  const updateField = useCallback((field: keyof SocialFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0: return !!(formData.customerName && formData.startingFollowers && formData.endingFollowers);
      case 1: return !!(formData.totalLikes && formData.avgEngagementRate);
      case 2: return !!(formData.topPost1Description && formData.bestPerformingFormat);
      case 3: return !!(formData.topCountry);
      case 4: return !!(formData.netNewFollowers && formData.growthRate);
      default: return false;
    }
  };

  const allStepsComplete = SOCIAL_STEPS.every((_, i) => isStepComplete(i));
  const isLastStep = currentStep === SOCIAL_STEPS.length - 1;
  const canGoNext = currentStep < SOCIAL_STEPS.length - 1;
  const canGoBack = currentStep > 0;

  return (
    <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-[0_40px_120px_rgba(0,0,0,0.9)] overflow-hidden">
      <div className="border-b border-white/10 px-6 md:px-8 py-5 md:py-6 flex items-center justify-between gap-6 bg-gradient-to-r from-pink-500/10 via-fuchsia-500/5 to-transparent">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Social Media Wrapped Dashboard</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
            Capture your social media story: followers, engagement, top posts, and audience insights.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <a
            href="/social-wrapped-template.csv"
            download
            className="inline-flex items-center rounded-full border border-pink-400/60 bg-pink-500/10 px-3 md:px-4 py-1.5 text-[11px] md:text-xs font-medium text-pink-300 hover:bg-pink-500/20 transition"
          >
            Data you will need
          </a>
          <span className="text-[10px] md:text-[11px] text-slate-400 max-w-xs text-right">
            Downloads a template with all required social metrics.
          </span>
        </div>
      </div>

      {/* Import Mode Toggle */}
      <div className="px-6 md:px-8 py-3 border-b border-white/10 flex gap-3">
        <button
          onClick={() => setImportMode("manual")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            importMode === "manual"
              ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25"
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
              ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Automatic Import
        </button>
      </div>

      {/* Step indicators - Only show for Manual Import */}
      {importMode === "manual" && (
      <div className="px-6 md:px-8 pt-4 pb-5 md:pb-6 border-b border-white/5 flex gap-2 overflow-x-auto">
        {SOCIAL_STEPS.map((step, index) => {
          const isActive = currentStep === index;
          const isComplete = isStepComplete(index);
          return (
            <button
              key={step}
              type="button"
              onClick={() => setCurrentStep(index)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition border flex items-center gap-2 ${
                isActive
                  ? "bg-white text-slate-900 border-white"
                  : isComplete
                  ? "bg-pink-500/20 text-pink-300 border-pink-400/40"
                  : "bg-slate-900/80 text-slate-300 border-white/10 hover:border-white/40"
              }`}
            >
              {isComplete && !isActive && <span className="text-green-400">✓</span>}
              <span>{index + 1}. {step}</span>
            </button>
          );
        })}
      </div>
      )}

      {/* Content - Manual Import */}
      {importMode === "manual" && (
      <div className="px-6 md:px-8 py-5 md:py-6">
        <section className="space-y-4">
          {currentStep === 0 && <SocialOverviewForm formData={formData} updateField={updateField} />}
          {currentStep === 1 && <SocialEngagementForm formData={formData} updateField={updateField} />}
          {currentStep === 2 && <SocialContentForm formData={formData} updateField={updateField} />}
          {currentStep === 3 && <SocialAudienceForm formData={formData} updateField={updateField} />}
          {currentStep === 4 && <SocialGrowthForm formData={formData} updateField={updateField} />}
        </section>

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={!canGoBack}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              canGoBack
                ? "bg-slate-800 text-white hover:bg-slate-700"
                : "bg-slate-900 text-slate-600 cursor-not-allowed"
            }`}
          >
            ← Back
          </button>

          <div className="text-xs text-slate-400">
            Step {currentStep + 1} of {SOCIAL_STEPS.length}
          </div>

          {isLastStep ? (
            <button
              type="button"
              onClick={async () => {
                const { buildSocialSlidesFromForm } = await import("../../lib/buildSlidesFromForm");
                const slides = buildSocialSlidesFromForm(formData);
                try {
                  const res = await fetch("/api/wraps", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: `${formData.customerName || "My"}'s Social Wrapped`,
                      wrap_type: "social",
                      year: new Date().getFullYear(),
                      form_data: formData,
                      slides_data: slides,
                    }),
                  });
                  const data = await res.json();
                  if (res.ok && data.shareUrl) {
                    router.push(data.shareUrl);
                  } else {
                    router.push("/wrap-social");
                  }
                } catch {
                  router.push("/wrap-social");
                }
              }}
              disabled={!allStepsComplete}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition shadow-lg ${
                allStepsComplete
                  ? "bg-pink-400 text-slate-950 hover:bg-pink-300"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              Generate Social Media Wrapped →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s + 1)}
              className="rounded-full px-5 py-2 text-sm font-medium bg-pink-500 text-white hover:bg-pink-400 transition"
            >
              Next →
            </button>
          )}
        </div>
      </div>
      )}

      {/* Automatic Import Placeholder */}
      {importMode === "automatic" && (
        <div className="p-6 md:p-8">
          <div className="rounded-2xl border-2 border-dashed border-pink-400/30 bg-pink-500/5 p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">API Integration Coming Soon</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
              Connect your social media accounts directly to automatically import your analytics data. 
              Supported platforms will include Instagram, TikTok, YouTube, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-xs text-slate-400">
                Instagram
              </div>
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-xs text-slate-400">
                TikTok
              </div>
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-xs text-slate-400">
                YouTube
              </div>
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-xs text-slate-400">
                Twitter/X
              </div>
            </div>
            <button
              onClick={() => setImportMode("manual")}
              className="mt-6 px-5 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition"
            >
              Use Manual Import Instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SocialFormProps {
  formData: SocialFormData;
  updateField: (field: keyof SocialFormData, value: string) => void;
}

function SocialOverviewForm({ formData, updateField }: SocialFormProps) {
  return (
    <div className="space-y-4">
      <Section
        title="Account overview"
        description="High-level metrics across your social presence."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow
          label="Customer / Brand name *"
          placeholder="Creator or brand name"
          value={formData.customerName}
          onChange={(v) => updateField("customerName", v)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300">Currency</label>
          <select
            className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
            value={formData.currencyCode}
            onChange={(e) => updateField("currencyCode", e.target.value)}
          >
            <option value="USD">$ USD</option>
            <option value="GBP">£ GBP</option>
            <option value="EUR">€ EUR</option>
            <option value="AED">د.إ AED</option>
            <option value="ZAR">R ZAR</option>
            <option value="AUD">$ AUD</option>
            <option value="CAD">$ CAD</option>
          </select>
        </div>
        <FieldRow label="Starting followers *" placeholder="45,200" help="Follower count at the start of the year." value={formData.startingFollowers} onChange={(v) => updateField("startingFollowers", v)} />
        <FieldRow label="Ending followers *" placeholder="128,500" help="Follower count at the end of the year." value={formData.endingFollowers} onChange={(v) => updateField("endingFollowers", v)} />
        <FieldRow label="Total impressions" placeholder="12,400,000" help="Total times your content was displayed." value={formData.totalImpressions} onChange={(v) => updateField("totalImpressions", v)} />
        <FieldRow label="Total reach" placeholder="4,800,000" help="Unique accounts that saw your content." value={formData.totalReach} onChange={(v) => updateField("totalReach", v)} />
        <FieldRow label="Total posts published" placeholder="312" help="Number of posts you published this year." value={formData.totalPostsPublished} onChange={(v) => updateField("totalPostsPublished", v)} />
        <FieldRow label="Primary platform" placeholder="Instagram" help="Your main social platform." value={formData.primaryPlatform} onChange={(v) => updateField("primaryPlatform", v)} />
      </div>
    </div>
  );
}

function SocialEngagementForm({ formData, updateField }: SocialFormProps) {
  return (
    <div className="space-y-4">
      <Section
        title="Engagement metrics"
        description="Likes, comments, shares, and engagement rate."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Total likes *" placeholder="890,000" help="Sum of all likes across posts." value={formData.totalLikes} onChange={(v) => updateField("totalLikes", v)} />
        <FieldRow label="Total comments" placeholder="42,000" help="Sum of all comments." value={formData.totalComments} onChange={(v) => updateField("totalComments", v)} />
        <FieldRow label="Total shares/retweets" placeholder="18,500" help="Times your content was shared." value={formData.totalShares} onChange={(v) => updateField("totalShares", v)} />
        <FieldRow label="Total saves" placeholder="65,000" help="Times your content was saved (if applicable)." value={formData.totalSaves} onChange={(v) => updateField("totalSaves", v)} />
        <FieldRow label="Average engagement rate *" placeholder="4.2%" help="(Likes + Comments + Shares) / Reach." value={formData.avgEngagementRate} onChange={(v) => updateField("avgEngagementRate", v)} />
        <FieldRow label="Best engagement day" placeholder="Thursdays" help="Day of week with highest engagement." value={formData.bestEngagementDay} onChange={(v) => updateField("bestEngagementDay", v)} />
      </div>
    </div>
  );
}

function SocialContentForm({ formData, updateField }: SocialFormProps) {
  return (
    <div className="space-y-6">
      <Section
        title="Top content"
        description="Your best-performing posts and content types."
      />

      {/* Top Post #1 */}
      <FormGroup title="Top Post #1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Description *" placeholder="Behind-the-scenes reel" help="Brief description of your top post." value={formData.topPost1Description} onChange={(v) => updateField("topPost1Description", v)} />
          <FieldRow label="Post URL" placeholder="https://instagram.com/p/..." help="Link to the post (viewers can click to view)." value={formData.topPost1Url} onChange={(v) => updateField("topPost1Url", v)} />
          <FieldRow label="Likes" placeholder="85,000" value={formData.topPost1Likes} onChange={(v) => updateField("topPost1Likes", v)} />
          <FieldRow label="Comments" placeholder="2,400" value={formData.topPost1Comments} onChange={(v) => updateField("topPost1Comments", v)} />
        </div>
      </FormGroup>

      {/* Top Post #2 */}
      <FormGroup title="Top Post #2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Description" placeholder="Product launch carousel" value={formData.topPost2Description} onChange={(v) => updateField("topPost2Description", v)} />
          <FieldRow label="Post URL" placeholder="https://instagram.com/p/..." value={formData.topPost2Url} onChange={(v) => updateField("topPost2Url", v)} />
          <FieldRow label="Likes" placeholder="32,000" value={formData.topPost2Likes} onChange={(v) => updateField("topPost2Likes", v)} />
          <FieldRow label="Comments" placeholder="1,200" value={formData.topPost2Comments} onChange={(v) => updateField("topPost2Comments", v)} />
        </div>
      </FormGroup>

      {/* Top Post #3 */}
      <FormGroup title="Top Post #3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Description" placeholder="Tutorial video" value={formData.topPost3Description} onChange={(v) => updateField("topPost3Description", v)} />
          <FieldRow label="Post URL" placeholder="https://instagram.com/p/..." value={formData.topPost3Url} onChange={(v) => updateField("topPost3Url", v)} />
          <FieldRow label="Likes" placeholder="18,000" value={formData.topPost3Likes} onChange={(v) => updateField("topPost3Likes", v)} />
          <FieldRow label="Comments" placeholder="800" value={formData.topPost3Comments} onChange={(v) => updateField("topPost3Comments", v)} />
        </div>
      </FormGroup>

      {/* Content Performance */}
      <FormGroup title="Content Performance">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="Best-performing format *" placeholder="Reels/Short-form video" help="Content format that performed best." value={formData.bestPerformingFormat} onChange={(v) => updateField("bestPerformingFormat", v)} />
          <FieldRow label="Most viral post reach" placeholder="2,400,000" help="Reach of your most viral piece." value={formData.mostViralPostReach} onChange={(v) => updateField("mostViralPostReach", v)} />
          <FieldRow label="Top hashtag" placeholder="#YourBrand" help="Hashtag that drove the most engagement." value={formData.topHashtag} onChange={(v) => updateField("topHashtag", v)} />
          <FieldRow label="Best campaign/series" placeholder="Summer Giveaway" help="Campaign or series that performed best." value={formData.bestCampaign} onChange={(v) => updateField("bestCampaign", v)} />
        </div>
      </FormGroup>
    </div>
  );
}

function SocialAudienceForm({ formData, updateField }: SocialFormProps) {
  return (
    <div className="space-y-4">
      <Section
        title="Audience insights"
        description="Demographics and behavior of your followers."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Top age range" placeholder="25-34" help="Age group with the most followers." value={formData.topAgeRange} onChange={(v) => updateField("topAgeRange", v)} />
        <FieldRow label="Gender split" placeholder="62% Female, 38% Male" value={formData.genderSplit} onChange={(v) => updateField("genderSplit", v)} />
        <FieldRow label="Top country *" placeholder="United States" value={formData.topCountry} onChange={(v) => updateField("topCountry", v)} />
        <FieldRow label="Top city" placeholder="Los Angeles" value={formData.topCity} onChange={(v) => updateField("topCity", v)} />
        <FieldRow label="Peak active hours" placeholder="7-9 PM" help="When your audience is most active." value={formData.peakActiveHours} onChange={(v) => updateField("peakActiveHours", v)} />
        <FieldRow label="Audience interests" placeholder="Fashion, Travel, Fitness" help="Top interest categories of your audience." value={formData.audienceInterests} onChange={(v) => updateField("audienceInterests", v)} />
      </div>
    </div>
  );
}

function SocialGrowthForm({ formData, updateField }: SocialFormProps) {
  return (
    <div className="space-y-4">
      <Section
        title="Growth & milestones"
        description="How your audience grew and key achievements."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow label="Net new followers *" placeholder="+83,300" help="Followers gained minus unfollows." value={formData.netNewFollowers} onChange={(v) => updateField("netNewFollowers", v)} />
        <FieldRow label="Growth rate *" placeholder="+184%" help="Percentage growth in followers." value={formData.growthRate} onChange={(v) => updateField("growthRate", v)} />
        <FieldRow label="Best growth month" placeholder="June" help="Month with the highest follower gain." value={formData.bestGrowthMonth} onChange={(v) => updateField("bestGrowthMonth", v)} />
        <FieldRow label="Milestone reached" placeholder="100K followers" help="Any follower milestones hit this year." value={formData.milestoneReached} onChange={(v) => updateField("milestoneReached", v)} />
        <FieldRow label="Notable collaborations" placeholder="Collab with @influencer" help="Brand or creator partnerships." value={formData.notableCollaborations} onChange={(v) => updateField("notableCollaborations", v)} />
        <FieldRow label="New platform launched" placeholder="Started TikTok in March" help="Any new platforms you joined this year." value={formData.newPlatformLaunched} onChange={(v) => updateField("newPlatformLaunched", v)} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ADS DASHBOARD
───────────────────────────────────────────────────────────────────────────── */

const ADS_STEPS = ["Overview", "Channels", "Campaigns", "Creatives", "Efficiency"] as const;
type AdsStepId = (typeof ADS_STEPS)[number];

interface AdsFormData {
  // Basics
  customerName: string;
  currencyCode: string;
  // Overview
  totalAdSpend: string;
  revenueAttributed: string;
  blendedRoas: string;
  totalConversions: string;
  totalImpressions: string;
  totalClicks: string;
  // Channels
  topChannelBySpend: string;
  spendOnTopChannel: string;
  topChannelRoas: string;
  secondChannel: string;
  spendOnSecondChannel: string;
  secondChannelRoas: string;
  bestRoasChannel: string;
  bestRoasChannelPerformance: string;
  // Campaigns
  topCampaign1Name: string;
  topCampaign1Revenue: string;
  topCampaign1Roas: string;
  topCampaign1Spend: string;
  topCampaign2Name: string;
  topCampaign2Revenue: string;
  mostEfficientCampaign: string;
  mostEfficientCampaignRoas: string;
  // Creatives
  topCreative1Description: string;
  topCreative1Performance: string;
  topCreative2Description: string;
  topCreative2Performance: string;
  bestPerformingFormat: string;
  bestHookAngle: string;
  totalCreativesTested: string;
  creativeWinRate: string;
  // Efficiency
  averageCpm: string;
  averageCpc: string;
  averageCpa: string;
  averageCtr: string;
  bestMonthForEfficiency: string;
  bestMonthCpa: string;
  yoyCpaChange: string;
  yoyRoasChange: string;
}

const initialAdsFormData: AdsFormData = {
  customerName: "",
  currencyCode: "USD",
  totalAdSpend: "",
  revenueAttributed: "",
  blendedRoas: "",
  totalConversions: "",
  totalImpressions: "",
  totalClicks: "",
  topChannelBySpend: "",
  spendOnTopChannel: "",
  topChannelRoas: "",
  secondChannel: "",
  spendOnSecondChannel: "",
  secondChannelRoas: "",
  bestRoasChannel: "",
  bestRoasChannelPerformance: "",
  topCampaign1Name: "",
  topCampaign1Revenue: "",
  topCampaign1Roas: "",
  topCampaign1Spend: "",
  topCampaign2Name: "",
  topCampaign2Revenue: "",
  mostEfficientCampaign: "",
  mostEfficientCampaignRoas: "",
  topCreative1Description: "",
  topCreative1Performance: "",
  topCreative2Description: "",
  topCreative2Performance: "",
  bestPerformingFormat: "",
  bestHookAngle: "",
  totalCreativesTested: "",
  creativeWinRate: "",
  averageCpm: "",
  averageCpc: "",
  averageCpa: "",
  averageCtr: "",
  bestMonthForEfficiency: "",
  bestMonthCpa: "",
  yoyCpaChange: "",
  yoyRoasChange: "",
};

function AdsDashboard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AdsFormData>(initialAdsFormData);
  const [showUploader, setShowUploader] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(ADS_FORM_STORAGE_KEY);
    if (stored) {
      try {
        setFormData(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(ADS_FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateField = useCallback((field: keyof AdsFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0: // Overview
        return !!(formData.customerName && formData.totalAdSpend && formData.revenueAttributed && formData.blendedRoas);
      case 1: // Channels
        return !!(formData.topChannelBySpend && formData.topChannelRoas);
      case 2: // Campaigns
        return !!(formData.topCampaign1Name && formData.topCampaign1Revenue);
      case 3: // Creatives
        return !!(formData.topCreative1Description && formData.bestPerformingFormat);
      case 4: // Efficiency
        return !!(formData.averageCpm && formData.averageCpa);
      default:
        return false;
    }
  };

  const allStepsComplete = ADS_STEPS.every((_, i) => isStepComplete(i));
  const isLastStep = currentStep === ADS_STEPS.length - 1;
  const canGoNext = currentStep < ADS_STEPS.length - 1;
  const canGoBack = currentStep > 0;

  return (
    <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-[0_40px_120px_rgba(0,0,0,0.9)] overflow-hidden">
      <div className="border-b border-white/10 px-6 md:px-8 py-5 md:py-6 flex items-center justify-between gap-6 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Ads Wrapped Dashboard</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
            Capture your paid media story: spend, ROAS, impressions, CPM, and winning creatives.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowUploader(true)}
              className="inline-flex items-center rounded-full border border-orange-400/60 bg-orange-500/20 px-3 md:px-4 py-1.5 text-[11px] md:text-xs font-medium text-orange-300 hover:bg-orange-500/30 transition gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import Meta Ads
            </button>
            <a
              href="/ads-wrapped-template.csv"
              download
              className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 md:px-4 py-1.5 text-[11px] md:text-xs font-medium text-slate-300 hover:bg-white/10 transition"
            >
              Data you will need
            </a>
          </div>
          <span className="text-[10px] md:text-[11px] text-slate-400 max-w-xs text-right">
            Upload your Meta Ads export or download a template.
          </span>
        </div>
      </div>

      {/* Note: Old uploader removed - using NewAdsDashboard now */}

      {/* Step indicators */}
      <div className="px-6 md:px-8 pt-4 pb-5 md:pb-6 border-b border-white/5 flex gap-2 overflow-x-auto">
        {ADS_STEPS.map((step, index) => {
          const isActive = currentStep === index;
          const isComplete = isStepComplete(index);
          return (
            <button
              key={step}
              type="button"
              onClick={() => setCurrentStep(index)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition border flex items-center gap-2 ${
                isActive
                  ? "bg-white text-slate-900 border-white"
                  : isComplete
                  ? "bg-orange-500/20 text-orange-300 border-orange-400/40"
                  : "bg-slate-900/80 text-slate-300 border-white/10 hover:border-white/40"
              }`}
            >
              {isComplete && !isActive && <span className="text-green-400">✓</span>}
              <span>{index + 1}. {step}</span>
            </button>
          );
        })}
      </div>

      <div className="px-6 md:px-8 py-5 md:py-6">
        <section className="space-y-4">
          {currentStep === 0 && <AdsOverviewForm formData={formData} updateField={updateField} />}
          {currentStep === 1 && <AdsChannelsForm formData={formData} updateField={updateField} />}
          {currentStep === 2 && <AdsCampaignsForm formData={formData} updateField={updateField} />}
          {currentStep === 3 && <AdsCreativesForm formData={formData} updateField={updateField} />}
          {currentStep === 4 && <AdsEfficiencyForm formData={formData} updateField={updateField} />}
        </section>

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={!canGoBack}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              canGoBack
                ? "bg-slate-800 text-white hover:bg-slate-700"
                : "bg-slate-900 text-slate-600 cursor-not-allowed"
            }`}
          >
            ← Back
          </button>

          <div className="text-xs text-slate-400">
            Step {currentStep + 1} of {ADS_STEPS.length}
          </div>

          {isLastStep ? (
            <button
              type="button"
              onClick={async () => {
                const { buildAdsSlidesFromForm } = await import("../../lib/buildSlidesFromForm");
                const slides = buildAdsSlidesFromForm(formData);
                try {
                  const res = await fetch("/api/wraps", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: `${formData.customerName || "My"}'s Ads Wrapped`,
                      wrap_type: "ads",
                      year: new Date().getFullYear(),
                      form_data: formData,
                      slides_data: slides,
                    }),
                  });
                  const data = await res.json();
                  if (res.ok && data.shareUrl) {
                    router.push(data.shareUrl);
                  } else {
                    router.push("/wrap-ads");
                  }
                } catch {
                  router.push("/wrap-ads");
                }
              }}
              disabled={!allStepsComplete}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition shadow-lg ${
                allStepsComplete
                  ? "bg-orange-400 text-slate-950 hover:bg-orange-300"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              Generate Ads Wrapped →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s + 1)}
              className="rounded-full px-5 py-2 text-sm font-medium bg-orange-500 text-white hover:bg-orange-400 transition"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface AdsFormProps {
  formData: AdsFormData;
  updateField: (field: keyof AdsFormData, value: string) => void;
}

function AdsOverviewForm({ formData, updateField }: AdsFormProps) {
  return (
    <div className="space-y-4">
      <Section
        title="Performance overview"
        description="High-level ad metrics: total spend, revenue, and blended ROAS."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow
          label="Customer / Brand name *"
          placeholder="Acme Co"
          value={formData.customerName}
          onChange={(v) => updateField("customerName", v)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300">Currency</label>
          <select
            className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
            value={formData.currencyCode}
            onChange={(e) => updateField("currencyCode", e.target.value)}
          >
            <option value="USD">$ USD</option>
            <option value="GBP">£ GBP</option>
            <option value="EUR">€ EUR</option>
            <option value="AED">د.إ AED</option>
            <option value="ZAR">R ZAR</option>
            <option value="AUD">$ AUD</option>
            <option value="CAD">$ CAD</option>
          </select>
        </div>
        <FieldRow
          label="Total ad spend *"
          placeholder="$812,000"
          help="Total amount spent on ads across all channels."
          value={formData.totalAdSpend}
          onChange={(v) => updateField("totalAdSpend", v)}
        />
        <FieldRow
          label="Revenue attributed to ads *"
          placeholder="$2,430,000"
          help="Total revenue directly attributed to paid ads."
          value={formData.revenueAttributed}
          onChange={(v) => updateField("revenueAttributed", v)}
        />
        <FieldRow
          label="Blended ROAS *"
          placeholder="3.0x"
          help="Return on ad spend (Revenue / Spend)."
          value={formData.blendedRoas}
          onChange={(v) => updateField("blendedRoas", v)}
        />
        <FieldRow
          label="Total conversions"
          placeholder="24,800"
          help="Total purchases or leads from ads."
          value={formData.totalConversions}
          onChange={(v) => updateField("totalConversions", v)}
        />
        <FieldRow
          label="Total impressions"
          placeholder="48,000,000"
          help="Total times your ads were shown."
          value={formData.totalImpressions}
          onChange={(v) => updateField("totalImpressions", v)}
        />
        <FieldRow
          label="Total clicks"
          placeholder="1,240,000"
          help="Total clicks on your ads."
          value={formData.totalClicks}
          onChange={(v) => updateField("totalClicks", v)}
        />
      </div>
    </div>
  );
}

function AdsChannelsForm({ formData, updateField }: AdsFormProps) {
  return (
    <div className="space-y-4">
      <Section
        title="Channel breakdown"
        description="Performance by ad platform: Meta, Google, TikTok, etc."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow
          label="Top channel by spend *"
          placeholder="Meta Ads"
          help="Platform where you spent the most."
          value={formData.topChannelBySpend}
          onChange={(v) => updateField("topChannelBySpend", v)}
        />
        <FieldRow
          label="Spend on top channel"
          placeholder="$480,000"
          value={formData.spendOnTopChannel}
          onChange={(v) => updateField("spendOnTopChannel", v)}
        />
        <FieldRow
          label="Top channel ROAS *"
          placeholder="3.2x"
          help="ROAS for your top spending channel."
          value={formData.topChannelRoas}
          onChange={(v) => updateField("topChannelRoas", v)}
        />
        <FieldRow
          label="Second channel"
          placeholder="Google Ads"
          value={formData.secondChannel}
          onChange={(v) => updateField("secondChannel", v)}
        />
        <FieldRow
          label="Spend on second channel"
          placeholder="$210,000"
          value={formData.spendOnSecondChannel}
          onChange={(v) => updateField("spendOnSecondChannel", v)}
        />
        <FieldRow
          label="Second channel ROAS"
          placeholder="2.8x"
          value={formData.secondChannelRoas}
          onChange={(v) => updateField("secondChannelRoas", v)}
        />
        <FieldRow
          label="Best ROAS channel"
          placeholder="TikTok Ads"
          help="Channel with the highest ROAS (may differ from top spend)."
          value={formData.bestRoasChannel}
          onChange={(v) => updateField("bestRoasChannel", v)}
        />
        <FieldRow
          label="Best ROAS channel performance"
          placeholder="4.1x ROAS on $82K spend"
          value={formData.bestRoasChannelPerformance}
          onChange={(v) => updateField("bestRoasChannelPerformance", v)}
        />
      </div>
    </div>
  );
}

function AdsCampaignsForm({ formData, updateField }: AdsFormProps) {
  return (
    <div className="space-y-4">
      <Section
        title="Top campaigns"
        description="Your best-performing campaigns by revenue and efficiency."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow
          label="Top campaign #1 name *"
          placeholder="BFCM Evergreen"
          help="Your highest revenue campaign."
          value={formData.topCampaign1Name}
          onChange={(v) => updateField("topCampaign1Name", v)}
        />
        <FieldRow
          label="Top campaign #1 revenue *"
          placeholder="$620,000"
          value={formData.topCampaign1Revenue}
          onChange={(v) => updateField("topCampaign1Revenue", v)}
        />
        <FieldRow
          label="Top campaign #1 ROAS"
          placeholder="4.2x"
          value={formData.topCampaign1Roas}
          onChange={(v) => updateField("topCampaign1Roas", v)}
        />
        <FieldRow
          label="Top campaign #1 spend"
          placeholder="$148,000"
          value={formData.topCampaign1Spend}
          onChange={(v) => updateField("topCampaign1Spend", v)}
        />
        <FieldRow
          label="Top campaign #2 name"
          placeholder="Summer Sale Prospecting"
          value={formData.topCampaign2Name}
          onChange={(v) => updateField("topCampaign2Name", v)}
        />
        <FieldRow
          label="Top campaign #2 revenue"
          placeholder="$380,000"
          value={formData.topCampaign2Revenue}
          onChange={(v) => updateField("topCampaign2Revenue", v)}
        />
        <FieldRow
          label="Most efficient campaign"
          placeholder="Retargeting - Cart Abandoners"
          help="Campaign with the best ROAS."
          value={formData.mostEfficientCampaign}
          onChange={(v) => updateField("mostEfficientCampaign", v)}
        />
        <FieldRow
          label="Most efficient campaign ROAS"
          placeholder="8.4x"
          value={formData.mostEfficientCampaignRoas}
          onChange={(v) => updateField("mostEfficientCampaignRoas", v)}
        />
      </div>
    </div>
  );
}

function AdsCreativesForm({ formData, updateField }: AdsFormProps) {
  return (
    <div className="space-y-4">
      <Section
        title="Creative performance"
        description="Your best-performing ad creatives and formats."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow
          label="Top creative #1 description *"
          placeholder="UGC video with unboxing"
          help="Brief description of your best ad creative."
          value={formData.topCreative1Description}
          onChange={(v) => updateField("topCreative1Description", v)}
        />
        <FieldRow
          label="Top creative #1 performance"
          placeholder="$420K revenue, 5.2x ROAS"
          value={formData.topCreative1Performance}
          onChange={(v) => updateField("topCreative1Performance", v)}
        />
        <FieldRow
          label="Top creative #2 description"
          placeholder="Founder story carousel"
          value={formData.topCreative2Description}
          onChange={(v) => updateField("topCreative2Description", v)}
        />
        <FieldRow
          label="Top creative #2 performance"
          placeholder="$280K revenue, 3.8x ROAS"
          value={formData.topCreative2Performance}
          onChange={(v) => updateField("topCreative2Performance", v)}
        />
        <FieldRow
          label="Best-performing format *"
          placeholder="Video (15-30 sec)"
          help="Ad format that performed best overall."
          value={formData.bestPerformingFormat}
          onChange={(v) => updateField("bestPerformingFormat", v)}
        />
        <FieldRow
          label="Best hook/angle"
          placeholder="Problem-solution testimonial"
          help="Messaging angle that resonated most."
          value={formData.bestHookAngle}
          onChange={(v) => updateField("bestHookAngle", v)}
        />
        <FieldRow
          label="Total creatives tested"
          placeholder="142"
          help="Number of unique creatives you tested."
          value={formData.totalCreativesTested}
          onChange={(v) => updateField("totalCreativesTested", v)}
        />
        <FieldRow
          label="Creative win rate"
          placeholder="18%"
          help="% of creatives that beat your benchmark."
          value={formData.creativeWinRate}
          onChange={(v) => updateField("creativeWinRate", v)}
        />
      </div>
    </div>
  );
}

function AdsEfficiencyForm({ formData, updateField }: AdsFormProps) {
  return (
    <div className="space-y-4">
      <Section
        title="Efficiency metrics"
        description="CPM, CPC, CPA, and other efficiency indicators."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow
          label="Total CPM (Impressions) *"
          placeholder="$16.90"
          help="Total cost per 1,000 impressions."
          value={formData.averageCpm}
          onChange={(v) => updateField("averageCpm", v)}
        />
        <FieldRow
          label="Average CPC"
          placeholder="$0.65"
          help="Cost per click."
          value={formData.averageCpc}
          onChange={(v) => updateField("averageCpc", v)}
        />
        <FieldRow
          label="Average Cost per Result *"
          placeholder="$32.70"
          help="Average cost per conversion/result."
          value={formData.averageCpa}
          onChange={(v) => updateField("averageCpa", v)}
        />
        <FieldRow
          label="Average CTR"
          placeholder="2.6%"
          help="Click-through rate."
          value={formData.averageCtr}
          onChange={(v) => updateField("averageCtr", v)}
        />
        <FieldRow
          label="Best month for efficiency"
          placeholder="September"
          help="Month with lowest CPA or highest ROAS."
          value={formData.bestMonthForEfficiency}
          onChange={(v) => updateField("bestMonthForEfficiency", v)}
        />
        <FieldRow
          label="Best month CPA"
          placeholder="$24.10"
          value={formData.bestMonthCpa}
          onChange={(v) => updateField("bestMonthCpa", v)}
        />
        <FieldRow
          label="YoY CPA change"
          placeholder="-18%"
          help="How CPA changed vs last year."
          value={formData.yoyCpaChange}
          onChange={(v) => updateField("yoyCpaChange", v)}
        />
        <FieldRow
          label="YoY ROAS change"
          placeholder="+22%"
          help="How ROAS changed vs last year."
          value={formData.yoyRoasChange}
          onChange={(v) => updateField("yoyRoasChange", v)}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

function FormGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-3">
      {title && (
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function Section({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-3">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="text-xs text-slate-300 mt-1 max-w-xl">{description}</p>
    </header>
  );
}

function FieldRow({
  label,
  placeholder,
  help,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  help?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const handleChange = (e: any) => {
    if (!onChange) return;

    const raw = e.target.value as string;
    if (!raw) {
      onChange("");
      return;
    }

    const trimmedPlaceholder = (placeholder || "").trim();
    // Detect simple 4-digit year fields (e.g. placeholder "2024" with a "Year" label)
    const isYearField =
      /^\d{4}$/.test(trimmedPlaceholder) &&
      label.toLowerCase().includes("year");

    if (isYearField) {
      // Keep only digits, no locale formatting or commas
      const digits = raw.replace(/[^0-9]/g, "").slice(0, 4);
      onChange(digits);
      return;
    }

    const numericPattern = /^[\$£€¥]?[+-]?[0-9,]+(\.[0-9]+)?%?$/;
    const shouldFormat = numericPattern.test(trimmedPlaceholder);

    if (!shouldFormat) {
      onChange(raw);
      return;
    }

    const isPercent = trimmedPlaceholder.endsWith("%");
    const isCurrency = /^[\$£€¥]/.test(trimmedPlaceholder);

    const cleaned = raw.replace(/[^0-9.\-]/g, "");
    if (!cleaned) {
      onChange("");
      return;
    }

    const num = Number(cleaned);
    if (Number.isNaN(num)) {
      onChange(raw);
      return;
    }

    let formatted: string;
    if (isCurrency) {
      const match = trimmedPlaceholder.match(/^[\$£€¥]/);
      const symbol = match?.[1] ?? "";
      formatted = symbol + num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else if (isPercent) {
      formatted = num.toLocaleString(undefined, { maximumFractionDigits: 1 }) + "%";
    } else {
      formatted = num.toLocaleString();
    }

    onChange(formatted);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-300">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={handleChange}
        className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none"
      />
      {help && <span className="text-[10px] text-slate-500">{help}</span>}
    </div>
  );
}
