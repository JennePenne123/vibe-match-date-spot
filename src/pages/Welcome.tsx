
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, ArrowRight, Settings } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) {
    navigate('/');
    return null;
  }

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 17) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  return (
    <div className="min-h-screen bg-datespot-gradient">
      {/* Header */}
      <div className="flex justify-between items-center p-4 pt-12">
        <Button
          onClick={() => navigate('/profile')}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <Settings className="w-6 h-6" />
        </Button>
        <Button
          onClick={logout}
          variant="ghost"
          className="text-white hover:bg-white/20"
        >
          Logout
        </Button>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {/* User Greeting */}
        <div className="text-center text-white mb-12 animate-fade-in">
          <div className="flex justify-center mb-4">
            <Avatar className="w-24 h-24 border-4 border-white/30">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-white/20 text-white text-2xl">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
          <h2 className="text-2xl font-bold mb-2">{getTimeGreeting()} ☀️</h2>
          <h1 className="text-4xl font-bold mb-4">{user.name.split(' ')[0]}</h1>
          <p className="text-xl text-white/90 mb-2">Ready for your perfect date?</p>
          <p className="text-white/80">
            Let's find the ideal spot that matches your vibe and creates unforgettable memories
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4 max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 rounded-full p-3">
                <Heart className="w-6 h-6 text-white" fill="currentColor" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Find Your Perfect Date Spot</h3>
                <p className="text-white/80 text-sm">AI-powered recommendations based on your preferences</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/preferences')}
              className="w-full bg-white text-datespot-blue hover:bg-white/90 font-semibold"
            >
              Start Discovery
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/friends')}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center text-white hover:bg-white/20 transition-all"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium">Invite Friends</div>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center text-white hover:bg-white/20 transition-all"
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
            className="w-full h-20 text-white/10"
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
