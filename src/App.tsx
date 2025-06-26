
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { GlobalStateProvider } from "./contexts/GlobalStateContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GlobalStateProvider>
          <AuthProvider>
            <AppProvider>
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppProvider>
          </AuthProvider>
        </GlobalStateProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
