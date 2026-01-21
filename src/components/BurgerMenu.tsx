
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Menu, User, Users, MapPin, LogOut, X, Heart, Monitor, Sun, Moon } from 'lucide-react';
import { getUserName, getUserAvatar } from '@/utils/typeHelpers';
import { getInitials } from '@/lib/utils';

const themeOptions = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

const BurgerMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const displayName = getUserName(user);

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
      icon: Heart,
      label: 'My Invitations',
      path: '/invitations',
      description: 'View all invitations'
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
          className="text-muted-foreground hover:bg-accent"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-w-md mx-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-sage-200 dark:border-sage-800">
                <AvatarImage src={getUserAvatar(user)} alt={displayName} referrerPolicy="no-referrer" />
                <AvatarFallback className="bg-sage-100 text-sage-600 dark:bg-sage-900/30 dark:text-sage-400">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-foreground">{displayName}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Theme Selector */}
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Appearance</p>
            <div className="flex gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                      isActive 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-border text-muted-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2 mb-6">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleMenuItemClick(item.path)}
                className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-sage-100 dark:bg-sage-900/30 rounded-lg">
                  <item.icon className="w-5 h-5 text-sage-600 dark:text-sage-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Logout Button */}
          <div className="border-t border-border pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-error-50 dark:hover:bg-error-950/20 transition-colors text-left text-error-600 dark:text-error-400"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-error-100 dark:bg-error-900/30 rounded-lg">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Sign Out</div>
                <div className="text-sm text-error-500 dark:text-error-400">Log out of your account</div>
              </div>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BurgerMenu;
