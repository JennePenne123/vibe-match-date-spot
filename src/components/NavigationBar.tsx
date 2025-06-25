
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, User, Settings, Users, MapPin, Heart } from 'lucide-react';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/landing', icon: Home, label: 'Home' },
    { path: '/preferences', icon: Heart, label: 'Dates' },
    { path: '/friends', icon: Users, label: 'Friends' },
    { path: '/area', icon: MapPin, label: 'Area' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 h-12 px-2 ${
                isActive(item.path) 
                  ? 'text-datespot-pink bg-datespot-light-pink/30' 
                  : 'text-gray-600 hover:text-datespot-pink hover:bg-datespot-light-pink/20'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
