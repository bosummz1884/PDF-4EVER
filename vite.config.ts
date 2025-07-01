import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Helper to get absolute paths for aliases (works in ESM Vite config)
const r = (p: string) => path.resolve(__dirname, "client", "src", p);
const rClient = (p: string) => path.resolve(__dirname, "client", p);

export default defineConfig({
  root: rClient(""),
  plugins: [
    react(),
    runtimeErrorOverlay(),
    // If you need the replit plugin, you must use Vite's async config!
    // For now, let's keep it simple and synchronous.
  ],
  resolve: {
    alias: {
      "@": r(""),
      "@components": r("components"),
      "@hooks": r("hooks"),
      "@lib": r("lib"),
      "@pages": r("pages"),
      "@types": r("types"),
      "@utils": r("utils"),
      "@services": r("services"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
      "@layers": path.resolve(
        __dirname,
        "client",
        "src",
        "features",
        "components",
        "layers"
      ),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom")
          ) {
            return "react";
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "radix-ui";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "framer-motion";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "lucide";
          }
          if (
            id.includes("node_modules/pdf-lib") ||
            id.includes("node_modules/pdfjs-dist") ||
            id.includes("node_modules/react-pdf") ||
            id.includes("node_modules/tesseract.js")
          ) {
            return "pdf-tools";
          }
          if (id.includes("node_modules/recharts")) {
            return "charts";
          }
          if (id.includes("node_modules/@supabase")) {
            return "supabase";
          }
          if (
            id.includes("node_modules/stripe") ||
            id.includes("node_modules/@stripe/stripe-js") ||
            id.includes("node_modules/@stripe/react-stripe-js")
          ) {
            return "stripe";
          }
          if (
            id.includes("node_modules/passport") ||
            id.includes("node_modules/passport-facebook") ||
            id.includes("node_modules/passport-google-oauth20") ||
            id.includes("node_modules/passport-local")
          ) {
            return "auth";
          }
          if (
            id.includes("node_modules/drizzle-orm") ||
            id.includes("node_modules/drizzle-zod")
          ) {
            return "drizzle";
          }
          if (id.includes("node_modules/embla-carousel-react")) {
            return "carousel";
          }
          if (id.includes("node_modules/wouter")) {
            return "router";
          }
          if (id.includes("node_modules/@tanstack/react-query")) {
            return "react-query";
          }
          if (
            id.includes("node_modules/tailwind-merge") ||
            id.includes("node_modules/tailwindcss-animate") ||
            id.includes("node_modules/tw-animate-css")
          ) {
            return "tailwind-plugins";
          }
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
