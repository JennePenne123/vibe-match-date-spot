
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Menu, User, Users, MapPin, LogOut, X } from 'lucide-react';

const BurgerMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      path: '/profile',
      description: 'Manage your account'
    },
    {
      icon: Users,
      label: 'My Friends',
      path: '/my-friends',
      description: 'Your connections'
    },
    {
      icon: MapPin,
      label: 'My Venues',
      path: '/my-venues',
      description: 'Favorite places'
    }
  ];

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-w-md mx-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-pink-200">
                <AvatarImage src={user?.avatar_url} alt={displayName} />
                <AvatarFallback className="bg-pink-100 text-pink-600">
                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-900">{displayName}</h2>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <div className="space-y-2 mb-6">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleMenuItemClick(item.path)}
                className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-pink-100 rounded-lg">
                  <item.icon className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Logout Button */}
          <div className="border-t pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-red-50 transition-colors text-left text-red-600"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Sign Out</div>
                <div className="text-sm text-red-500">Log out of your account</div>
              </div>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BurgerMenu;
