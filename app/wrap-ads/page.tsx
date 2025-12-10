"use client";

import { useEffect, useState } from "react";
import { WrapPlayer } from "../../components/wrap/WrapPlayer";
import { SaveWrapDialog } from "../../components/wrap/SaveWrapDialog";
import { Slide } from "../../lib/wrapSlides";
import { buildAdsSlidesFromForm } from "../../lib/buildSlidesFromForm";
import { AdsFormData, ADS_FORM_STORAGE_KEY } from "../../lib/formDataTypes";

export default function WrapAdsPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [formData, setFormData] = useState<AdsFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    // Try to load form data from localStorage
    const stored = localStorage.getItem(ADS_FORM_STORAGE_KEY);
    
    if (stored) {
      try {
        const parsedFormData: AdsFormData = JSON.parse(stored);
        setFormData(parsedFormData);
        // Build slides from form data
        const customSlides = buildAdsSlidesFromForm(parsedFormData);
        setSlides(customSlides);
      } catch {
        // Fallback to default intro slide
        setSlides([
          {
            id: "intro",
            type: "intro",
            title: "Ads Wrapped",
            subtitle: "Fill out the form to generate your personalized Ads Wrapped.",
          },
          {
            id: "recap",
            type: "recap",
            title: "No data yet",
            subtitle: "Go back and fill out the Ads dashboard form.",
            payload: { handle: "Advertiser" },
          },
        ]);
      }
    } else {
      // No form data
      setSlides([
        {
          id: "intro",
          type: "intro",
          title: "Ads Wrapped",
          subtitle: "Fill out the form to generate your personalized Ads Wrapped.",
        },
        {
          id: "recap",
          type: "recap",
          title: "No data yet",
          subtitle: "Go back and fill out the Ads dashboard form.",
          payload: { handle: "Advertiser" },
        },
      ]);
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading your Ads Wrapped...</div>
      </div>
    );
  }

  return (
    <>
      <WrapPlayer 
        slides={slides}
        showSaveButton={!!formData}
        onSave={() => setShowSaveDialog(true)}
      />
      <SaveWrapDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        wrapType="ads"
        formData={formData}
        slidesData={slides}
        title={formData?.customerName ? `${formData.customerName}'s Ads Wrapped` : undefined}
      />
    </>
  );
}
