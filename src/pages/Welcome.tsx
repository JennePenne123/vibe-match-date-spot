
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
    if (!loading && !user && !isDemoMode) {
      navigate('/');
    }
  }, [user, loading, navigate, isDemoMode]);

  if (loading && !isDemoMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user && !isDemoMode) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center p-4 pt-12 bg-white shadow-sm">
        <Button
          onClick={() => navigate(isDemoMode ? '/profile?demo=true' : '/profile')}
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:bg-gray-100"
        >
          <Settings className="w-6 h-6" />
        </Button>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="text-gray-600 hover:bg-gray-100"
        >
          {isDemoMode ? 'Exit Demo' : 'Logout'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {/* User Greeting */}
        <div className="text-center text-gray-900 mb-12 animate-fade-in pt-8">
          <div className="flex justify-center mb-4">
            <Avatar className="w-24 h-24 border-4 border-datespot-light-pink">
              <AvatarImage src={isDemoMode ? undefined : user?.profile?.avatar_url} alt={displayName} />
              <AvatarFallback className="bg-datespot-light-pink text-datespot-dark-pink text-2xl">
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          {isDemoMode && (
            <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              🎯 Demo Mode - Exploring DateSpot features
            </div>
          )}
          <h2 className="text-2xl font-bold mb-2 text-gray-800">{getTimeGreeting()} ☀️</h2>
          <h1 className="text-4xl font-bold mb-4 text-gray-900">{firstName}</h1>
          <p className="text-xl text-gray-700 mb-2">Ready for your perfect date?</p>
          <p className="text-gray-600">
            Let's find the ideal spot that matches your vibe and creates unforgettable memories
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4 max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-datespot-light-pink rounded-full p-3">
                <Heart className="w-6 h-6 text-datespot-pink" fill="currentColor" />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold text-lg">Find Your Perfect Date Spot</h3>
                <p className="text-gray-600 text-sm">AI-powered recommendations based on your preferences</p>
              </div>
            </div>
            <Button
              onClick={() => navigate(isDemoMode ? '/preferences?demo=true' : '/preferences')}
              className="w-full bg-datespot-gradient text-white hover:opacity-90 font-semibold"
            >
              Start Discovery
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate(isDemoMode ? '/friends?demo=true' : '/friends')}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center text-gray-700 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium">Invite Friends</div>
            </button>
            <button
              onClick={() => navigate(isDemoMode ? '/profile?demo=true' : '/profile')}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center text-gray-700 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm font-medium">Settings</div>
            </button>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="mt-16">
          <svg
            viewBox="0 0 1200 120"
            className="w-full h-20 text-gray-100"
            fill="currentColor"
          >
            <path d="M0,96L48,80C96,64,192,32,288,37.3C384,43,480,85,576,112C672,139,768,149,864,133.3C960,117,1056,75,1152,69.3C1248,64,1344,96,1392,112L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
