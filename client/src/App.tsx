// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toast";
import { useToast } from "@/features/hooks/use-toast";
import { useIsMobile } from "@/features/hooks/use-mobile";
import HomePage from "@/pages/home";
import LandingPage from "@/pages/landing";
import NotFoundPage from "@/pages/not-found";
import PricingPage from "@/pages/pricing";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import PDFEditorContainer from "@/features/pdf-editor/PDFEditorContainer";

export default function App() {
  const isMobile = useIsMobile();

  // For toasts (global notifications)
  useToast();

  return (
    <BrowserRouter>
      {/* Toasts (global UI notifications) */}
      <Toaster />

      {/* App Content */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/editor" element={<PDFEditorContainer isMobile={isMobile} />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
