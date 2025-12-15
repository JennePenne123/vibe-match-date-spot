import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import ErrorBoundary from "./components/ErrorBoundary";
import NotificationSystem from "./components/NotificationSystem";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import AppLayout from "./components/AppLayout";
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
import AIVenueCardDemo from "./pages/AIVenueCardDemo";
import PremiumDesignSystemDemo from "./pages/PremiumDesignSystemDemo";
import Debug from "./pages/Debug";
import RatingDemo from "./pages/RatingDemo";
import Landing from "./pages/Landing";
import PartnerDashboard from "./pages/partner/Dashboard";
import PartnerVouchers from "./pages/partner/Vouchers";
import PartnerVenues from "./pages/partner/Venues";
import ShareholderReport from "./pages/ShareholderReport";
import AIInsights from "./pages/AIInsights";

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
                    
                    {/* Debug route */}
                    <Route path="/debug" element={<AppLayout><Debug /></AppLayout>} />
                    
                    {/* Partner Routes */}
                    <Route path="/partner" element={<AppLayout><PartnerDashboard /></AppLayout>} />
                    <Route path="/partner/vouchers" element={<AppLayout><PartnerVouchers /></AppLayout>} />
                    <Route path="/partner/venues" element={<AppLayout><PartnerVenues /></AppLayout>} />
                    
                    {/* Demo routes without layout */}
                    <Route path="/demo/ai-venue-card" element={<AIVenueCardDemo />} />
                    <Route path="/demo/premium-design-system" element={<PremiumDesignSystemDemo />} />
                    <Route path="/demo/rating" element={<RatingDemo />} />
                    <Route path="/shareholder-report" element={<ShareholderReport />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </NotificationSystem>
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
