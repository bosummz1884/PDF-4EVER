// src/App.tsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toast";
import { useToast } from "@/features/hooks/use-toast";
import { useIsMobile } from "@/features/hooks/use-mobile";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { SignupDialog } from "@/components/auth/SignupDialog";
import HomePage from "@/pages/home";
import LandingPage from "@/pages/landing";
import NotFoundPage from "@/pages/not-found";
import PricingPage from "@/pages/pricing";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import PDFEditorContainer from "@/features/pdf-editor/PDFEditorContainer";

export default function App() {
  // Auth dialog state
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isMobile = useIsMobile();

  // For toasts (global notifications)
  useToast();

  // Auth event handlers
  const handleLoginSuccess = (user: any, token: string) => {
    setUser(user);
    setShowLogin(false);
    // Save token, etc. here if needed
  };

  const handleSignupSuccess = (user: any, token: string) => {
    setUser(user);
    setShowSignup(false);
    // Save token, etc. here if needed
  };

  return (
    <BrowserRouter>
      {/* Main UI Overlay Modals */}
      <LoginDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        onSuccess={handleLoginSuccess}
      />
      <SignupDialog
        open={showSignup}
        onOpenChange={setShowSignup}
        onSuccess={handleSignupSuccess}
      />

      {/* Toasts (global UI notifications) */}
      <Toaster />

      {/* App Content */}
      <Routes>
        <Route path="/" element={<LandingPage onLogin={() => setShowLogin(true)} onSignup={() => setShowSignup(true)} />} />
        <Route path="/home" element={<HomePage user={user} />} />
        <Route path="/editor" element={<PDFEditorContainer user={user} isMobile={isMobile} />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
