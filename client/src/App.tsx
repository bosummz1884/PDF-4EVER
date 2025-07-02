import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toast";
import { useToast } from "@/features/hooks/use-toast";
import { useIsMobile } from "@/features/hooks/use-mobile";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import HomePage from "@/pages/home";
import NotFoundPage from "@/pages/not-found";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import PDFEditorContainer from "@/features/pdf-editor/PDFEditorContainer";

export default function App() {
  const isMobile = useIsMobile();

  // For toasts (global notifications)
  useToast();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="pdf4ever-theme">
      <BrowserRouter>
        {/* Toasts (global UI notifications) */}
        <Toaster />
        {isMobile && <div>Welcome, mobile user!</div>}

        {/* App Content */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/editor" element={<PDFEditorContainer />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}