"use client";

import { useEffect, useState } from "react";
import { WrapPlayer } from "../../components/wrap/WrapPlayer";
import { SaveWrapDialog } from "../../components/wrap/SaveWrapDialog";
import { buildSlides, getWrapData, Slide } from "../../lib/wrapSlides";
import { buildEcommSlidesFromForm } from "../../lib/buildSlidesFromForm";
import { EcommFormData, ECOMM_FORM_STORAGE_KEY } from "../../lib/formDataTypes";

export default function WrapEcommercePage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [formData, setFormData] = useState<EcommFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    // Try to load form data from localStorage
    const stored = localStorage.getItem(ECOMM_FORM_STORAGE_KEY);
    
    if (stored) {
      try {
        const parsedFormData: EcommFormData = JSON.parse(stored);
        setFormData(parsedFormData);
        // Build slides from form data
        const customSlides = buildEcommSlidesFromForm(parsedFormData);
        setSlides(customSlides);
      } catch {
        // Fallback to default data
        const data = getWrapData();
        setSlides(buildSlides(data));
      }
    } else {
      // No form data, use default
      const data = getWrapData();
      setSlides(buildSlides(data));
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading your Wrapped...</div>
      </div>
    );
  }

  return (
    <>
      <WrapPlayer 
        slides={slides} 
        showSaveButton={true}
        onSave={() => setShowSaveDialog(true)}
      />
      <SaveWrapDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        wrapType="ecommerce"
        formData={formData}
        slidesData={slides}
        year={formData?.year ? parseInt(formData.year) : new Date().getFullYear()}
        title={formData?.userName ? `${formData.userName}'s E-commerce Wrapped` : undefined}
      />
    </>
  );
}
