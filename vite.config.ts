import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          // Radix UI primitives
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix';
          }
          // Charting
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // Maps
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'vendor-maps';
          }
          // Animation
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // Supabase
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          // PDF / QR
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas') || id.includes('node_modules/qrcode')) {
            return 'vendor-pdf';
          }
          // i18n
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'vendor-i18n';
          }
          // QR scanner
          if (id.includes('node_modules/html5-qrcode')) {
            return 'vendor-qr-scanner';
          }
          // Sentry
          if (id.includes('node_modules/@sentry/')) {
            return 'vendor-sentry';
          }
          // Tanstack query
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query';
          }
        },
      },
    },
  },
}));
