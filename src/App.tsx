import { lazy, Suspense, useEffect } from "react";
import { DEFAULT_STALE_TIME, DEFAULT_GC_TIME } from "@/config/queryConfig";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
import { ThemeProvider } from "next-themes";
import AdminRouteGuard from "./components/AdminRouteGuard";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import ErrorBoundary from "./components/ErrorBoundary";
import NotificationSystem from "./components/NotificationSystem";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import OfflineBanner from "./components/OfflineBanner";
import AppLayout from "./components/AppLayout";
import LoadingSpinner from "./components/LoadingSpinner";
import { useAppUsageTracking } from "./hooks/useImplicitSignals";
import { isLovablePreviewEnvironment } from "./utils/runtimeEnvironment";

function AppUsageTracker() {
  useAppUsageTracking();
  return null;
}

function ServiceWorkerCacheReset() {
  useEffect(() => {
    // Skip entirely in Lovable preview – sw.js is not served there
    if (isLovablePreviewEnvironment()) {
      return;
    }

    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('caches' in window)) {
      return;
    }

    const RESET_KEY = 'vybe-sw-reset-v3';

    const resetCaches = async () => {
      if (sessionStorage.getItem(RESET_KEY) === 'done') return;
      sessionStorage.setItem(RESET_KEY, 'done');

      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(async (registration) => {
            await registration.update().catch(() => undefined);
            registration.waiting?.postMessage({ type: 'CLEAR_CACHE' });
            registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
            registration.active?.postMessage({ type: 'CLEAR_CACHE' });
          })
        );

        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('vybepulse-'))
            .map((cacheName) => caches.delete(cacheName))
        );
      } catch (error) {
        console.error('Failed to reset service worker cache:', error);
      }
    };

    void resetCaches();
  }, []);

  return null;
}

// Only Landing is eagerly loaded (first screen users see)
import Landing from "./pages/Landing";

// All protected routes – lazy loaded
const Onboarding = lazy(() => import("./pages/Onboarding"));
const MoodCheckIn = lazy(() => import("./pages/MoodCheckIn"));
const Home = lazy(() => import("./pages/Home"));
const Preferences = lazy(() => import("./pages/Preferences"));
const Friends = lazy(() => import("./pages/Friends"));

const Results = lazy(() => import("./pages/Results"));
const VenueDetail = lazy(() => import("./pages/VenueDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Venues = lazy(() => import("./pages/Venues"));
const MyFriends = lazy(() => import("./pages/MyFriends"));
const MyVenues = lazy(() => import("./pages/MyVenues"));
const Invitations = lazy(() => import("./pages/Invitations"));
const Chats = lazy(() => import("./pages/Chats"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIRecommendations = lazy(() => import("./pages/AIRecommendations"));
const SmartDatePlanning = lazy(() => import("./pages/SmartDatePlanning"));
const AIInsights = lazy(() => import("./pages/AIInsights"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const AGB = lazy(() => import("./pages/AGB"));

// Partner routes – lazy loaded
const PartnerDashboard = lazy(() => import("./pages/partner/Dashboard"));
const PartnerOnboarding = lazy(() => import("./pages/partner/Onboarding"));
const PartnerVouchers = lazy(() => import("./pages/partner/Vouchers"));
const PartnerVenues = lazy(() => import("./pages/partner/Venues"));
const PartnerReports = lazy(() => import("./pages/partner/Reports"));
const PartnerQRCode = lazy(() => import("./pages/partner/QRCode"));
const PartnerNetworkMap = lazy(() => import("./pages/partner/NetworkMap"));
const PartnerProfile = lazy(() => import("./pages/partner/Profile"));
const PartnerCityRankings = lazy(() => import("./pages/partner/CityRankings"));
const PartnerNotifications = lazy(() => import("./pages/partner/Notifications"));
const PartnerVenueComparison = lazy(() => import("./pages/partner/VenueComparison"));
const PartnerTerms = lazy(() => import("./pages/partner/Terms"));
const PartnerPrivacy = lazy(() => import("./pages/partner/Privacy"));

// Admin routes – lazy loaded
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminModeration = lazy(() => import("./pages/admin/Moderation"));
const AdminSystemHealth = lazy(() => import("./pages/admin/SystemHealth"));
const AdminErrors = lazy(() => import("./pages/admin/Errors"));

// Demo/debug routes – lazy loaded
const Debug = lazy(() => import("./pages/Debug"));
const ShareholderReport = lazy(() => import("./pages/ShareholderReport"));
const AIVenueCardDemo = lazy(() => import("./pages/AIVenueCardDemo"));
const PremiumDesignSystemDemo = lazy(() => import("./pages/PremiumDesignSystemDemo"));
const RatingDemo = lazy(() => import("./pages/RatingDemo"));
const VenueDesignSystemDemo = lazy(() => import("./pages/VenueDesignSystemDemo"));
const ModernDesignSystemDemo = lazy(() => import("./pages/ModernDesignSystemDemo"));

// Suspense fallback – minimal spinner
const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoadingSpinner size="lg" />
  </div>
);

// Wrap lazy page in Suspense + AppLayout
function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LazyFallback />}>
      <AppLayout>{children}</AppLayout>
    </Suspense>
  );
}

function LazyPageNoLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LazyFallback />}>{children}</Suspense>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      staleTime: DEFAULT_STALE_TIME, // 5 minutes – balanced freshness
      gcTime: DEFAULT_GC_TIME, // 30 minutes – keep unused data in cache longer
      refetchOnWindowFocus: false, // prevent unnecessary refetches on tab switch
      refetchOnReconnect: true, // auto-refetch after offline recovery
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary level="app">
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="vybe-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <AppProvider>
              <NotificationSystem>
                <ServiceWorkerCacheReset />
                <OfflineBanner />
                <PushNotificationPrompt />
                <AppUsageTracker />
                <ErrorBoundary level="page" silent={true}>
                  <Routes>
                    {/* Public routes without layout */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/index" element={<Navigate to="/" replace />} />
                    <Route path="/index.html" element={<Navigate to="/" replace />} />
                    <Route path="/welcome" element={<LazyPageNoLayout><Onboarding /></LazyPageNoLayout>} />
                    <Route path="/mood" element={<LazyPageNoLayout><MoodCheckIn /></LazyPageNoLayout>} />
                    <Route path="/auth" element={<Navigate to="/?auth=required" replace />} />
                    <Route path="/register-login" element={<Navigate to="/?auth=required" replace />} />
                    
                    {/* Protected routes with responsive layout */}
                    <Route path="/home" element={<LazyPage><Home /></LazyPage>} />
                    <Route path="/preferences" element={<LazyPage><Preferences /></LazyPage>} />
                    <Route path="/friends" element={<LazyPage><Friends /></LazyPage>} />
                    
                    <Route path="/results" element={<LazyPage><Results /></LazyPage>} />
                    <Route path="/venue/:id" element={<LazyPage><VenueDetail /></LazyPage>} />
                    <Route path="/profile" element={<LazyPage><Profile /></LazyPage>} />
                    <Route path="/settings" element={<LazyPage><Settings /></LazyPage>} />
                    <Route path="/venues" element={<LazyPage><Venues /></LazyPage>} />
                    <Route path="/my-friends" element={<LazyPage><MyFriends /></LazyPage>} />
                    <Route path="/my-venues" element={<LazyPage><MyVenues /></LazyPage>} />
                    <Route path="/invitations" element={<LazyPage><Invitations /></LazyPage>} />
                    <Route path="/chats" element={<LazyPage><Chats /></LazyPage>} />
                    <Route path="/ai-recommendations" element={<LazyPage><AIRecommendations /></LazyPage>} />
                    <Route path="/ai-insights" element={<LazyPage><AIInsights /></LazyPage>} />
                    <Route path="/plan-date" element={<LazyPage><SmartDatePlanning /></LazyPage>} />
                    <Route path="/rewards" element={<LazyPage><Rewards /></LazyPage>} />
                    
                    {/* Legal pages – accessible without auth */}
                    <Route path="/impressum" element={<LazyPageNoLayout><Impressum /></LazyPageNoLayout>} />
                    <Route path="/datenschutz" element={<LazyPageNoLayout><Datenschutz /></LazyPageNoLayout>} />
                    <Route path="/agb" element={<LazyPageNoLayout><AGB /></LazyPageNoLayout>} />
                    
                    {/* Debug route */}
                    <Route path="/debug" element={<LazyPage><Debug /></LazyPage>} />
                    
                    {/* Partner Routes */}
                    <Route path="/partner" element={<LazyPage><PartnerDashboard /></LazyPage>} />
                    <Route path="/partner/vouchers" element={<LazyPage><PartnerVouchers /></LazyPage>} />
                    <Route path="/partner/venues" element={<LazyPage><PartnerVenues /></LazyPage>} />
                    <Route path="/partner/reports" element={<LazyPage><PartnerReports /></LazyPage>} />
                    <Route path="/partner/qr-code" element={<LazyPage><PartnerQRCode /></LazyPage>} />
                    <Route path="/partner/qr-scanner" element={<LazyPage><PartnerQRCode defaultTab="scanner" /></LazyPage>} />
                    <Route path="/partner/network-map" element={<LazyPage><PartnerNetworkMap /></LazyPage>} />
                    <Route path="/partner/network" element={<LazyPage><PartnerNetworkMap /></LazyPage>} />
                    <Route path="/partner/profile" element={<LazyPage><PartnerProfile /></LazyPage>} />
                    <Route path="/partner/city-rankings" element={<LazyPage><PartnerCityRankings /></LazyPage>} />
                    <Route path="/partner/notifications" element={<LazyPage><PartnerNotifications /></LazyPage>} />
                    <Route path="/partner/venue-comparison" element={<LazyPage><PartnerVenueComparison /></LazyPage>} />
                    <Route path="/partner/onboarding" element={<LazyPage><PartnerOnboarding /></LazyPage>} />
                    
                    {/* Admin Routes – protected by role check */}
                    <Route path="/admin" element={<LazyPage><AdminRouteGuard><AdminDashboard /></AdminRouteGuard></LazyPage>} />
                    <Route path="/admin/analytics" element={<LazyPage><AdminRouteGuard><AdminAnalytics /></AdminRouteGuard></LazyPage>} />
                    <Route path="/admin/users" element={<LazyPage><AdminRouteGuard><AdminUsers /></AdminRouteGuard></LazyPage>} />
                    <Route path="/admin/moderation" element={<LazyPage><AdminRouteGuard><AdminModeration /></AdminRouteGuard></LazyPage>} />
                    <Route path="/admin/health" element={<LazyPage><AdminRouteGuard><AdminSystemHealth /></AdminRouteGuard></LazyPage>} />
                    <Route path="/admin/reports" element={<LazyPage><AdminRouteGuard><AdminModeration /></AdminRouteGuard></LazyPage>} />
                    <Route path="/admin/errors" element={<LazyPage><AdminRouteGuard><AdminErrors /></AdminRouteGuard></LazyPage>} />
                    
                    {/* Demo routes */}
                    <Route path="/demo/ai-venue-card" element={<LazyPageNoLayout><AIVenueCardDemo /></LazyPageNoLayout>} />
                    <Route path="/demo/premium-design-system" element={<LazyPageNoLayout><PremiumDesignSystemDemo /></LazyPageNoLayout>} />
                    <Route path="/demo/rating" element={<LazyPageNoLayout><RatingDemo /></LazyPageNoLayout>} />
                    <Route path="/demo/venue-design-system" element={<LazyPageNoLayout><VenueDesignSystemDemo /></LazyPageNoLayout>} />
                    <Route path="/demo/modern-venue-design" element={<LazyPageNoLayout><ModernDesignSystemDemo /></LazyPageNoLayout>} />
                    <Route path="/shareholder-report" element={<LazyPageNoLayout><ShareholderReport /></LazyPageNoLayout>} />
                    <Route path="*" element={<LazyPageNoLayout><NotFound /></LazyPageNoLayout>} />
                  </Routes>
                </ErrorBoundary>
              </NotificationSystem>
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
