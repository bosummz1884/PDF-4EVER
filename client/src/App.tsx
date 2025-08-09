import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthSystem";

// Import Page Components
import HomePage from "@/pages/home";
import PricingPage from "@/pages/pricing";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import NotFoundPage from "@/pages/not-found";

export default function App() {
  return (
    <ThemeProvider
      defaultTheme="dark"
      storageKey="pdf-app-theme"
      data-oid="prycx75"
    >
      <BrowserRouter data-oid="8x.8iba">
        <AuthProvider data-oid="c4648-d">
          <Toaster data-oid="lum4:yf" />
          <Routes data-oid="d-9:2oi">
            <Route
              path="/"
              element={<HomePage data-oid="7notf10" />}
              data-oid="blb0mui"
            />



            <Route
              path="/pricing"
              element={<PricingPage data-oid="pxo1qwo" />}
              data-oid="arr733o"
            />

            <Route
              path="/privacy-policy"
              element={<PrivacyPolicyPage data-oid="gj-fdks" />}
              data-oid="-q8dwnv"
            />

            <Route
              path="/terms-of-service"
              element={<TermsOfServicePage data-oid="263dp6z" />}
              data-oid="gmub-i."
            />

            <Route
              path="*"
              element={<NotFoundPage data-oid="gtv3b:b" />}
              data-oid="5w__k4d"
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
