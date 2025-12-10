"use client";

import { useEffect, useState } from "react";
import { WrapPlayer } from "../../components/wrap/WrapPlayer";
import { SaveWrapDialog } from "../../components/wrap/SaveWrapDialog";
import { Slide } from "../../lib/wrapSlides";
import { buildSocialSlidesFromForm } from "../../lib/buildSlidesFromForm";
import { SocialFormData, SOCIAL_FORM_STORAGE_KEY } from "../../lib/formDataTypes";

export default function WrapSocialPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [formData, setFormData] = useState<SocialFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    // Try to load form data from localStorage
    const stored = localStorage.getItem(SOCIAL_FORM_STORAGE_KEY);
    
    if (stored) {
      try {
        const parsedFormData: SocialFormData = JSON.parse(stored);
        setFormData(parsedFormData);
        // Build slides from form data
        const customSlides = buildSocialSlidesFromForm(parsedFormData);
        setSlides(customSlides);
      } catch {
        // Fallback to default intro slide
        setSlides([
          {
            id: "intro",
            type: "intro",
            title: "Social Media Wrapped",
            subtitle: "Fill out the form to generate your personalized Social Media Wrapped.",
          },
          {
            id: "recap",
            type: "recap",
            title: "No data yet",
            subtitle: "Go back and fill out the Social Media dashboard form.",
            payload: { handle: "Creator" },
          },
        ]);
      }
    } else {
      // No form data
      setSlides([
        {
          id: "intro",
          type: "intro",
          title: "Social Media Wrapped",
          subtitle: "Fill out the form to generate your personalized Social Media Wrapped.",
        },
        {
          id: "recap",
          type: "recap",
          title: "No data yet",
          subtitle: "Go back and fill out the Social Media dashboard form.",
          payload: { handle: "Creator" },
        },
      ]);
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading your Social Media Wrapped...</div>
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
        wrapType="social"
        formData={formData}
        slidesData={slides}
        title={formData?.customerName ? `${formData.customerName}'s Social Wrapped` : undefined}
      />
    </>
  );
}
