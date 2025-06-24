import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer()
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@components": path.resolve(import.meta.dirname, "client", "src", "components"),
      "@hooks": path.resolve(import.meta.dirname, "client", "src", "hooks"),
      "@lib": path.resolve(import.meta.dirname, "client", "src", "lib"),
      "@pages": path.resolve(import.meta.dirname, "client", "src", "pages"),
      "@types": path.resolve(import.meta.dirname, "client", "src", "types"),
      "@utils": path.resolve(import.meta.dirname, "client", "src", "utils"),
      "@services": path.resolve(import.meta.dirname, "client", "src", "services"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
          // Radix UI
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          // Framer Motion
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          // Lucide Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
          // PDF tools
          if (
            id.includes('node_modules/pdf-lib') ||
            id.includes('node_modules/pdfjs-dist') ||
            id.includes('node_modules/react-pdf') ||
            id.includes('node_modules/tesseract.js')
          ) {
            return 'pdf-tools';
          }
          // Charting
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
          // Stripe
          if (
            id.includes('node_modules/stripe') ||
            id.includes('node_modules/@stripe/stripe-js') ||
            id.includes('node_modules/@stripe/react-stripe-js')
          ) {
            return 'stripe';
          }
          // Passport.js and strategies
          if (
            id.includes('node_modules/passport') ||
            id.includes('node_modules/passport-facebook') ||
            id.includes('node_modules/passport-google-oauth20') ||
            id.includes('node_modules/passport-local')
          ) {
            return 'auth';
          }
          // Drizzle ORM & Drizzle-Zod
          if (
            id.includes('node_modules/drizzle-orm') ||
            id.includes('node_modules/drizzle-zod')
          ) {
            return 'drizzle';
          }
          // Embla Carousel
          if (id.includes('node_modules/embla-carousel-react')) {
            return 'carousel';
          }
          // wouter (routing)
          if (id.includes('node_modules/wouter')) {
            return 'router';
          }
          // React Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }
          // Tailwind & plugins
          if (
            id.includes('node_modules/tailwind-merge') ||
            id.includes('node_modules/tailwindcss-animate') ||
            id.includes('node_modules/tw-animate-css')
          ) {
            return 'tailwind-plugins';
          }
          // Default: let Rollup decide
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
