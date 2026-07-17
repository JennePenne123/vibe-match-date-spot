import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

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
    VitePWA({
      // We register the service worker ourselves via a guarded wrapper.
      injectRegister: null,
      registerType: "autoUpdate",
      filename: "sw.js",
      // Never emit/register a service worker in dev or Lovable preview.
      devOptions: {
        enabled: false,
      },
      // Keep the existing, hand-maintained manifest.json in public/.
      manifest: false,
      includeAssets: [
        "favicon.png",
        "icon-192.png",
        "icon-512.png",
        "app-icon.png",
        "placeholder.svg",
        "offline.html",
      ],
      workbox: {
        cacheId: "hioutz",
        // Pull in push-notification handling (kept separate from the app shell cache).
        importScripts: ["/sw-push.js"],
        // Precache the built app shell + hashed assets.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // Navigation + offline fallback are handled in sw-push.js (imported
        // above) so we can serve /offline.html as a last resort. Disable
        // Workbox's own navigate route to avoid a double-respondWith conflict
        // (no `navigateFallback` = no Workbox NavigationRoute).
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Google Fonts stylesheets.
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "hioutz-google-fonts-styles" },
          },
          {
            // Google Fonts webfont files.
            urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "hioutz-google-fonts-webfonts",
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Images.
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "hioutz-images",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
