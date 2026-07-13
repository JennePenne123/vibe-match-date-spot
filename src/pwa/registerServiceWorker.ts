/**
 * Guarded service worker registration for the H!Outz PWA.
 *
 * The Workbox service worker (`/sw.js`) is generated at build time by
 * vite-plugin-pwa. This wrapper is the ONLY place that registers it and it
 * refuses to run in any dev/preview context so Lovable previews never get
 * stuck on a cached shell.
 */

const SW_URL = "/sw.js";

function isRefusedContext(): boolean {
  if (typeof window === "undefined") return true;

  // Only register in production builds.
  if (!import.meta.env.PROD) return true;

  // Never register inside an iframe (Lovable editor preview runs in one).
  if (window.self !== window.top) return true;

  // Explicit kill switch: ?sw=off
  if (new URLSearchParams(window.location.search).has("sw")) {
    if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  }

  const host = window.location.hostname;
  const refusedHost =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");

  return refusedHost;
}

async function unregisterAppServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => {
          const url =
            registration.active?.scriptURL ||
            registration.waiting?.scriptURL ||
            registration.installing?.scriptURL ||
            "";
          return url.endsWith("/sw.js");
        })
        .map((registration) => registration.unregister()),
    );
  } catch {
    // no-op
  }
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  if (isRefusedContext()) {
    // Clean up any previously-registered app service worker in refused contexts.
    void unregisterAppServiceWorkers();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SW_URL, { scope: "/" })
      .then((registration) => {
        // Ask a waiting worker to activate immediately (autoUpdate).
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              installing.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((error) => {
        console.error("[PWA] Service worker registration failed:", error);
      });
  });
}

/** Exposed so push-notification code can reuse the active registration. */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  if (isRefusedContext()) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}