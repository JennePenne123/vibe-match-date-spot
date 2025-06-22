import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, ArrowRight, Settings } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';

  React.useEffect(() => {
    // Only redirect if not in demo mode and not loading and no user
    if (!isDemoMode && !loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate, isDemoMode]);

  // In demo mode, skip loading check entirely
  if (!isDemoMode && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vyy-soft to-vyy-glow flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Only check for user if not in demo mode
  if (!isDemoMode && !user) {
    return null;
  }

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 17) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  // Demo mode data
  const displayName = isDemoMode 
    ? 'Demo User' 
    : (user?.profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User');
  const firstName = displayName.split(' ')[0];

  const handleLogout = () => {
    if (isDemoMode) {
      navigate('/');
    } else {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vyy-soft via-vyy-glow to-vyy-warm">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 pt-12 bg-white/70 backdrop-blur-sm shadow-sm">
          <Button
            onClick={() => navigate(isDemoMode ? '/profile?demo=true' : '/profile')}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:bg-white/50 rounded-2xl"
          >
            <Settings className="w-6 h-6" />
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-gray-600 hover:bg-white/50 rounded-2xl"
          >
            {isDemoMode ? 'Exit Demo' : 'Logout'}
          </Button>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-8">
          {/* User Greeting */}
          <div className="text-center text-gray-900 mb-12 animate-fade-in pt-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Avatar className="w-28 h-28 border-4 border-white shadow-2xl animate-float">
                  <AvatarImage src={isDemoMode ? undefined : user?.profile?.avatar_url} alt={displayName} />
                  <AvatarFallback className="bg-vyy-primary text-white text-3xl">
                    {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-vyy-sunset rounded-full flex items-center justify-center animate-pulse-glow">
                  ✨
                </div>
              </div>
            </div>
            {isDemoMode && (
              <div className="mb-6 px-4 py-3 bg-blue-100/80 backdrop-blur-sm border border-blue-200 rounded-2xl text-blue-800 text-sm">
                🎯 Demo Mode - Exploring vyybmtch magic
              </div>
            )}
            <h2 className="text-2xl font-bold mb-3 text-gray-800">{getTimeGreeting()} ☀️</h2>
            <h1 className="text-5xl font-bold mb-6 text-expressive text-organic">{firstName}</h1>
            <p className="text-xl text-gray-700 mb-3 font-medium">Ready for magical connections?</p>
            <p className="text-gray-600 leading-relaxed">
              Let's discover perfect moments that match your energy and create beautiful memories together
            </p>
          </div>

          {/* Action Cards */}
          <div className="space-y-6">
            <div className="organic-card bg-white/80 backdrop-blur-sm p-8 shadow-2xl border-0">
              <div className="flex items-center gap-5 mb-6">
                <div className="organic-blob p-4 animate-float">
                  <Heart className="w-8 h-8 text-white" fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold text-xl text-organic">Find Your Perfect Match</h3>
                  <p className="text-gray-600 text-sm mt-1">AI-powered connections based on your unique vibe</p>
                </div>
              </div>
              <Button
                onClick={() => navigate(isDemoMode ? '/preferences?demo=true' : '/preferences')}
                className="w-full bg-vyy-primary hover:opacity-90 text-white font-semibold h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all text-lg"
              >
                Start Discovery
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate(isDemoMode ? '/friends?demo=true' : '/friends')}
                className="organic-card bg-white/70 backdrop-blur-sm p-6 shadow-lg border-0 text-center text-gray-700 hover:shadow-xl transition-all hover:bg-white/90"
              >
                <div className="text-3xl mb-3 animate-float">👥</div>
                <div className="text-sm font-semibold">Connect</div>
              </button>
              <button
                onClick={() => navigate(isDemoMode ? '/profile?demo=true' : '/profile')}
                className="organic-card bg-white/70 backdrop-blur-sm p-6 shadow-lg border-0 text-center text-gray-700 hover:shadow-xl transition-all hover:bg-white/90"
              >
                <div className="text-3xl mb-3 animate-float">⚙️</div>
                <div className="text-sm font-semibold">Settings</div>
              </button>
            </div>
          </div>

          {/* Bottom decorative element */}
          <div className="mt-16 flex justify-center">
            <div className="w-32 h-2 bg-vyy-primary rounded-full opacity-30 animate-organic-morph"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
