
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import ErrorBoundary from "./components/ErrorBoundary";
import NotificationSystem from "./components/NotificationSystem";
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
                <ErrorBoundary level="page">
                  <Routes>
                    <Route path="/" element={<Onboarding />} />
                    <Route path="/register-login" element={<RegisterLogin />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/preferences" element={<Preferences />} />
                    <Route path="/friends" element={<Friends />} />
                    <Route path="/area" element={<Area />} />
                    <Route path="/results" element={<Results />} />
                    <Route path="/venue/:id" element={<VenueDetail />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/venues" element={<Venues />} />
                    <Route path="/my-friends" element={<MyFriends />} />
                    <Route path="/my-venues" element={<MyVenues />} />
                    <Route path="/invitations" element={<Invitations />} />
                    <Route path="/ai-recommendations" element={<AIRecommendations />} />
                    <Route path="/plan-date" element={<SmartDatePlanning />} />
                    <Route path="/demo/ai-venue-card" element={<AIVenueCardDemo />} />
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
