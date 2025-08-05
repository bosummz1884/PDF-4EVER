import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { AuthProvider } from '@/components/auth/AuthSystem';

// Import Page Components
import HomePage from '@/pages/home';
import PricingPage from '@/pages/pricing';
import PrivacyPolicyPage from '@/pages/privacy-policy';
import TermsOfServicePage from '@/pages/terms-of-service';
import NotFoundPage from '@/pages/not-found';
import PDFToolkit from './components/PDFToolkit';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="pdf-app-theme">
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/toolkit" element={<PDFToolkit />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}