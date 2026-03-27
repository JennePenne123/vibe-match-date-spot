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
        manualChunks: {
          // Heavy UI/charting libs
          'vendor-charts': ['recharts'],
          'vendor-maps': ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
          'vendor-motion': ['framer-motion'],
          // Supabase SDK
          'vendor-supabase': ['@supabase/supabase-js'],
          // React core (shared across all chunks)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // PDF / QR utilities
          'vendor-pdf': ['jspdf', 'html2canvas', 'qrcode.react'],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
}));
