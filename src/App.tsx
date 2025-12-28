import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import ErrorBoundary from "./components/ErrorBoundary";
import NotificationSystem from "./components/NotificationSystem";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import AppLayout from "./components/AppLayout";
import LoadingSpinner from "./components/LoadingSpinner";
import Onboarding from "./pages/Onboarding";
import RegisterLogin from "./pages/RegisterLogin";
import Home from "./pages/Home";
import Preferences from "./pages/Preferences";
import Friends from "./pages/Friends";
import Area from "./pages/Area";
import Results from "./pages/Results";
import VenueDetail from "./pages/VenueDetail";
import Profile from "./pages/Profile";
import Venues from "./pages/Venues";
import MyFriends from "./pages/MyFriends";
import MyVenues from "./pages/MyVenues";
import Invitations from "./pages/Invitations";
import NotFound from "./pages/NotFound";
import AIRecommendations from "./pages/AIRecommendations";
import SmartDatePlanning from "./pages/SmartDatePlanning";
import Landing from "./pages/Landing";
import PartnerDashboard from "./pages/partner/Dashboard";
import PartnerVouchers from "./pages/partner/Vouchers";
import PartnerVenues from "./pages/partner/Venues";
import AIInsights from "./pages/AIInsights";

// Lazy load demo/debug routes (rarely visited, ~1,133 lines)
const Debug = lazy(() => import("./pages/Debug"));
const ShareholderReport = lazy(() => import("./pages/ShareholderReport"));
const AIVenueCardDemo = lazy(() => import("./pages/AIVenueCardDemo"));
const PremiumDesignSystemDemo = lazy(() => import("./pages/PremiumDesignSystemDemo"));
const RatingDemo = lazy(() => import("./pages/RatingDemo"));

// Suspense fallback for lazy routes
const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" text="Loading..." />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
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
          <AuthProvider>
            <AppProvider>
              <NotificationSystem>
                <PushNotificationPrompt />
                <ErrorBoundary level="page" silent={true}>
                  <Routes>
                    {/* Public routes without layout */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/welcome" element={<Onboarding />} />
                    <Route path="/register-login" element={<Navigate to="/?auth=required" replace />} />
                    
                    {/* Protected routes with responsive layout */}
                    <Route path="/home" element={<AppLayout><Home /></AppLayout>} />
                    <Route path="/preferences" element={<AppLayout><Preferences /></AppLayout>} />
                    <Route path="/friends" element={<AppLayout><Friends /></AppLayout>} />
                    <Route path="/area" element={<AppLayout><Area /></AppLayout>} />
                    <Route path="/results" element={<AppLayout><Results /></AppLayout>} />
                    <Route path="/venue/:id" element={<AppLayout><VenueDetail /></AppLayout>} />
                    <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
                    <Route path="/venues" element={<AppLayout><Venues /></AppLayout>} />
                    <Route path="/my-friends" element={<AppLayout><MyFriends /></AppLayout>} />
                    <Route path="/my-venues" element={<AppLayout><MyVenues /></AppLayout>} />
                    <Route path="/invitations" element={<AppLayout><Invitations /></AppLayout>} />
                    <Route path="/ai-recommendations" element={<AppLayout><AIRecommendations /></AppLayout>} />
                    <Route path="/ai-insights" element={<AppLayout><AIInsights /></AppLayout>} />
                    <Route path="/plan-date" element={<AppLayout><SmartDatePlanning /></AppLayout>} />
                    
                    {/* Debug route - lazy loaded */}
                    <Route path="/debug" element={
                      <Suspense fallback={<LazyFallback />}>
                        <AppLayout><Debug /></AppLayout>
                      </Suspense>
                    } />
                    
                    {/* Partner Routes */}
                    <Route path="/partner" element={<AppLayout><PartnerDashboard /></AppLayout>} />
                    <Route path="/partner/vouchers" element={<AppLayout><PartnerVouchers /></AppLayout>} />
                    <Route path="/partner/venues" element={<AppLayout><PartnerVenues /></AppLayout>} />
                    
                    {/* Demo routes - lazy loaded */}
                    <Route path="/demo/ai-venue-card" element={
                      <Suspense fallback={<LazyFallback />}>
                        <AIVenueCardDemo />
                      </Suspense>
                    } />
                    <Route path="/demo/premium-design-system" element={
                      <Suspense fallback={<LazyFallback />}>
                        <PremiumDesignSystemDemo />
                      </Suspense>
                    } />
                    <Route path="/demo/rating" element={
                      <Suspense fallback={<LazyFallback />}>
                        <RatingDemo />
                      </Suspense>
                    } />
                    <Route path="/shareholder-report" element={
                      <Suspense fallback={<LazyFallback />}>
                        <ShareholderReport />
                      </Suspense>
                    } />
                    <Route path="*" element={<NotFound />} />
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
