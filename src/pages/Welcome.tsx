
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, ArrowRight } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user?.profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const firstName = displayName.split(' ')[0];

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 17) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 pt-12 bg-white shadow-sm">
          <Button
            onClick={logout}
            variant="ghost"
            className="text-gray-600 hover:bg-gray-100"
          >
            Logout
          </Button>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-8">
          {/* User Greeting */}
          <div className="text-center text-gray-900 mb-12 animate-fade-in pt-8">
            <div className="flex justify-center mb-4">
              <Avatar className="w-24 h-24 border-4 border-pink-200">
                <AvatarImage src={user?.profile?.avatar_url} alt={displayName} />
                <AvatarFallback className="bg-pink-100 text-pink-600 text-2xl">
                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">{getTimeGreeting()} ☀️</h2>
            <h1 className="text-4xl font-bold mb-4 text-gray-900">{firstName}</h1>
            <p className="text-xl text-gray-700 mb-2">Ready for your perfect date?</p>
            <p className="text-gray-600">
              Let's find the ideal spot that matches your vibe and creates unforgettable memories
            </p>
          </div>

          {/* Action Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-pink-100 rounded-full p-3">
                  <Heart className="w-6 h-6 text-pink-500" fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-lg">Find Your Perfect Date Spot</h3>
                  <p className="text-gray-600 text-sm">AI-powered recommendations based on your preferences</p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/landing')}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600 font-semibold"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
